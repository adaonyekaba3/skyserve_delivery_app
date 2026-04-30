import { Injectable } from '@nestjs/common';
import { and, desc, eq, ilike, or } from 'drizzle-orm';
import { BaseRepository } from 'src/shared/database/base.repository';
import {
  packages,
  restaurants,
  users,
} from '../../../drizzle/schema';

export interface CreatePackageRow {
  orderId: string;
  senderId: string;
  recipientPhone: string;
  recipientId?: string | null;
  recipientType: 'user' | 'vendor' | 'guest';
  recipientName?: string | null;
  category: string;
  weightClass: string;
  isFragile: boolean;
  description?: string | null;
  pickupAddress: string;
  pickupLatitude?: string | null;
  pickupLongitude?: string | null;
  dropoffAddress: string;
  dropoffLatitude?: string | null;
  dropoffLongitude?: string | null;
  trackingToken: string;
}

@Injectable()
export class PackagesRepository extends BaseRepository {
  insert(row: CreatePackageRow) {
    return this.db.insert(packages).values(row).returning();
  }

  findById(id: string) {
    return this.db.select().from(packages).where(eq(packages.id, id)).limit(1);
  }

  findByOrderId(orderId: string) {
    return this.db
      .select()
      .from(packages)
      .where(eq(packages.orderId, orderId))
      .limit(1);
  }

  findByTrackingToken(token: string) {
    return this.db
      .select()
      .from(packages)
      .where(eq(packages.trackingToken, token))
      .limit(1);
  }

  listForSender(senderId: string, limit = 50) {
    return this.db
      .select()
      .from(packages)
      .where(eq(packages.senderId, senderId))
      .orderBy(desc(packages.createdAt))
      .limit(limit);
  }

  listAllForAdmin(limit = 100) {
    return this.db
      .select()
      .from(packages)
      .orderBy(desc(packages.createdAt))
      .limit(limit);
  }

  findUserByPhone(phone: string) {
    return this.db
      .select()
      .from(users)
      .where(eq(users.phoneNumber, phone))
      .limit(1);
  }

  findVendorByPhone(phone: string, name?: string) {
    const conditions = [ilike(restaurants.address, `%${phone}%`)];
    if (name) {
      conditions.push(ilike(restaurants.name, `%${name}%`));
    }
    return this.db
      .select()
      .from(restaurants)
      .where(and(eq(restaurants.isActive, true), or(...conditions)))
      .limit(1);
  }
}
