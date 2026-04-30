import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomBytes } from 'crypto';
import { eq } from 'drizzle-orm';
import { DrizzleService } from 'src/shared/database/drizzle.service';
import { PusherService } from 'src/shared/realtime/pusher.service';
import { OutboxService } from 'src/shared/events/outbox.service';
import { normalizeNgPhone } from 'src/shared/utils/phone.util';
import { orders, packages, users } from '../../../../drizzle/schema';
import { PackagesRepository } from '../packages.repository';
import {
  PackagePriority,
  PackageWeightClass,
  PriceBreakdown,
  quotePackage,
} from '../pricing';

export type PackageCategory =
  | 'documents'
  | 'food'
  | 'parcel'
  | 'gift'
  | 'other';

export interface RecipientLookupResult {
  recipientType: 'user' | 'vendor' | 'guest';
  recipientId?: string;
  name?: string;
  address?: string;
  latitude?: string;
  longitude?: string;
  phone: string;
}

export interface QuoteInput {
  weightClass: PackageWeightClass;
  deliveryPriority: PackagePriority;
}

export interface CreatePackageInput {
  senderId: string;
  recipientPhone: string;
  recipientName?: string | null;
  category: PackageCategory;
  weightClass: PackageWeightClass;
  deliveryPriority: PackagePriority;
  isFragile?: boolean;
  description?: string | null;
  pickupAddress: string;
  pickupLatitude?: string | null;
  pickupLongitude?: string | null;
  dropoffAddress: string;
  dropoffLatitude?: string | null;
  dropoffLongitude?: string | null;
}

type PackageRow = typeof packages.$inferSelect;
type OrderRow = typeof orders.$inferSelect;

export interface PackageView {
  package: PackageRow;
  order: OrderRow | undefined;
  senderName: string | null;
}

export interface CreatePackageResult {
  package: PackageRow;
  order: OrderRow;
  pricing: PriceBreakdown;
}

@Injectable()
export class PackagesService {
  constructor(
    private readonly packagesRepository: PackagesRepository,
    private readonly drizzleService: DrizzleService,
    private readonly pusherService: PusherService,
    private readonly outboxService: OutboxService,
  ) {}

  quote(input: QuoteInput): PriceBreakdown {
    return quotePackage(input.weightClass, input.deliveryPriority);
  }

  async lookupRecipient(rawPhone: string): Promise<RecipientLookupResult> {
    const phone = normalizeNgPhone(rawPhone);
    if (!phone) {
      throw new BadRequestException(
        'Invalid Nigerian phone number. Use +234 format.',
      );
    }

    const userRows = await this.packagesRepository.findUserByPhone(phone);
    if (userRows.length > 0) {
      const u = userRows[0];
      return {
        recipientType: 'user',
        recipientId: u.id,
        name: u.fullName,
        address: u.defaultAddress ?? undefined,
        latitude: u.defaultLatitude ?? undefined,
        longitude: u.defaultLongitude ?? undefined,
        phone,
      };
    }

    return { recipientType: 'guest', phone };
  }

  async create(input: CreatePackageInput): Promise<CreatePackageResult> {
    const phone = normalizeNgPhone(input.recipientPhone);
    if (!phone) {
      throw new BadRequestException(
        'Invalid Nigerian phone number. Use +234 format.',
      );
    }
    if (!input.dropoffAddress?.trim()) {
      throw new BadRequestException('Dropoff address is required');
    }
    if (!input.pickupAddress?.trim()) {
      throw new BadRequestException('Pickup address is required');
    }

    const breakdown = this.quote({
      weightClass: input.weightClass,
      deliveryPriority: input.deliveryPriority,
    });

    const lookup = await this.lookupRecipient(phone);
    const trackingToken = generateTrackingToken();

    const created = await this.drizzleService.db.transaction(async (tx) => {
      const [order] = await tx
        .insert(orders)
        .values({
          customerId: input.senderId,
          restaurantId: null,
          orderType: 'package_delivery',
          deliveryPriority: input.deliveryPriority,
          totalAmount: breakdown.total.toFixed(2),
          deliveryAddress: input.dropoffAddress,
          deliveryLatitude: input.dropoffLatitude ?? undefined,
          deliveryLongitude: input.dropoffLongitude ?? undefined,
        })
        .returning();

      const [pkg] = await tx
        .insert(packages)
        .values({
          orderId: order.id,
          senderId: input.senderId,
          recipientPhone: phone,
          recipientId: lookup.recipientId ?? null,
          recipientType: lookup.recipientType,
          recipientName: input.recipientName ?? lookup.name ?? null,
          category: input.category,
          weightClass: input.weightClass,
          isFragile: input.isFragile ?? false,
          description: input.description ?? null,
          pickupAddress: input.pickupAddress,
          pickupLatitude: input.pickupLatitude ?? null,
          pickupLongitude: input.pickupLongitude ?? null,
          dropoffAddress: input.dropoffAddress,
          dropoffLatitude: input.dropoffLatitude ?? null,
          dropoffLongitude: input.dropoffLongitude ?? null,
          trackingToken,
        })
        .returning();

      return { order, pkg };
    });

    const result: CreatePackageResult = {
      package: created.pkg,
      order: created.order,
      pricing: breakdown,
    };

    await Promise.all([
      this.pusherService.trigger(
        `private-customer-${input.senderId}`,
        'package_created',
        result,
      ),
      this.pusherService.trigger('private-admin', 'package_changed', {
        type: 'created',
        package: created.pkg,
        order: created.order,
      }),
      lookup.recipientId
        ? this.pusherService.trigger(
            `private-customer-${lookup.recipientId}`,
            'package_received',
            result,
          )
        : Promise.resolve(),
    ]);

    await this.outboxService.enqueue('package.created', {
      packageId: created.pkg.id,
      orderId: created.order.id,
      senderId: input.senderId,
      recipientId: lookup.recipientId ?? null,
      recipientPhone: phone,
      trackingToken,
    });

    return result;
  }

  async getMine(userId: string): Promise<PackageRow[]> {
    return this.packagesRepository.listForSender(userId);
  }

  async listAllForAdmin(): Promise<PackageRow[]> {
    return this.packagesRepository.listAllForAdmin();
  }

  async getById(
    userId: string,
    role: string,
    id: string,
  ): Promise<PackageView> {
    const rows = await this.packagesRepository.findById(id);
    const pkg = rows[0];
    if (!pkg) {
      throw new NotFoundException(`Package ${id} not found`);
    }
    const isOwner = pkg.senderId === userId || pkg.recipientId === userId;
    const isAdmin = role === 'ADMIN' || role === 'OPERATIONS';
    if (!isOwner && !isAdmin) {
      throw new ForbiddenException('You cannot view this package');
    }
    return this.assembleView(pkg);
  }

  async getByTrackingToken(token: string): Promise<PackageView> {
    const rows = await this.packagesRepository.findByTrackingToken(token);
    const pkg = rows[0];
    if (!pkg) {
      throw new NotFoundException('Tracking token not found');
    }
    return this.assembleView(pkg);
  }

  private async assembleView(pkg: PackageRow): Promise<PackageView> {
    const [order] = await this.drizzleService.db
      .select()
      .from(orders)
      .where(eq(orders.id, pkg.orderId))
      .limit(1);
    let senderName: string | null = null;
    if (pkg.senderId) {
      const r = await this.drizzleService.db
        .select({ fullName: users.fullName })
        .from(users)
        .where(eq(users.id, pkg.senderId))
        .limit(1);
      senderName = r[0]?.fullName ?? null;
    }
    return { package: pkg, order, senderName };
  }
}

function generateTrackingToken(): string {
  return randomBytes(12).toString('hex').toUpperCase();
}
