import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { DrizzleService } from 'src/shared/database/drizzle.service';
import { PusherService } from 'src/shared/realtime/pusher.service';
import { OutboxService } from 'src/shared/events/outbox.service';
import { OrdersService } from 'src/modules/orders/application/orders.service';
import { orders, payments } from '../../../../drizzle/schema';
import { BankTransfersRepository } from '../bank-transfers.repository';

@Injectable()
export class BankTransfersService {
  constructor(
    private readonly bankTransfersRepository: BankTransfersRepository,
    private readonly drizzleService: DrizzleService,
    private readonly pusherService: PusherService,
    private readonly outboxService: OutboxService,
    private readonly ordersService: OrdersService,
  ) {}

  async list(status?: string) {
    return this.bankTransfersRepository.list(status);
  }

  async approve(id: string, adminUserId: string, notes?: string) {
    const rows = await this.bankTransfersRepository.findById(id);
    const existing = rows[0];
    if (!existing) {
      throw new NotFoundException('Bank transfer not found');
    }
    if (existing.status !== 'PENDING_REVIEW') {
      throw new BadRequestException(
        `Bank transfer already ${existing.status}`,
      );
    }
    const [updated] = await this.bankTransfersRepository.updateStatus({
      id,
      status: 'APPROVED',
      verifiedBy: adminUserId,
      notes,
    });

    await this.drizzleService.db
      .update(payments)
      .set({ status: 'CAPTURED', updatedAt: new Date() })
      .where(eq(payments.id, existing.paymentId));

    const [orderRow] = await this.drizzleService.db
      .select()
      .from(orders)
      .where(eq(orders.id, existing.orderId))
      .limit(1);
    if (orderRow && orderRow.status === 'PENDING') {
      try {
        await this.ordersService.updateStatus(
          existing.orderId,
          'ACCEPTED',
          adminUserId,
        );
      } catch {
        // Order may already be advanced; ignore.
      }
    }

    await this.pusherService.trigger('private-admin', 'bank_transfer_changed', {
      type: 'approved',
      bankTransfer: updated,
    });
    if (orderRow) {
      await this.pusherService.trigger(
        `private-customer-${orderRow.customerId}`,
        'payment_succeeded',
        { orderId: existing.orderId, paymentId: existing.paymentId },
      );
    }
    await this.outboxService.enqueue('bank_transfer.approved', {
      bankTransferId: id,
      orderId: existing.orderId,
      paymentId: existing.paymentId,
    });

    return updated;
  }

  async reject(id: string, adminUserId: string, notes: string) {
    const rows = await this.bankTransfersRepository.findById(id);
    const existing = rows[0];
    if (!existing) {
      throw new NotFoundException('Bank transfer not found');
    }
    if (existing.status !== 'PENDING_REVIEW') {
      throw new BadRequestException(
        `Bank transfer already ${existing.status}`,
      );
    }
    const [updated] = await this.bankTransfersRepository.updateStatus({
      id,
      status: 'REJECTED',
      verifiedBy: adminUserId,
      notes,
    });

    await this.drizzleService.db
      .update(payments)
      .set({ status: 'FAILED', updatedAt: new Date() })
      .where(eq(payments.id, existing.paymentId));

    const [orderRow] = await this.drizzleService.db
      .select()
      .from(orders)
      .where(eq(orders.id, existing.orderId))
      .limit(1);

    await this.pusherService.trigger('private-admin', 'bank_transfer_changed', {
      type: 'rejected',
      bankTransfer: updated,
    });
    if (orderRow) {
      await this.pusherService.trigger(
        `private-customer-${orderRow.customerId}`,
        'payment_failed',
        { orderId: existing.orderId, reason: notes },
      );
    }
    await this.outboxService.enqueue('bank_transfer.rejected', {
      bankTransferId: id,
      orderId: existing.orderId,
      reason: notes,
    });

    return updated;
  }
}
