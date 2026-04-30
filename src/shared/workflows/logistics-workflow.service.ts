import { Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import {
  deliveries,
  orders,
  payments,
  statusEvents,
} from '../../../drizzle/schema';
import { DrizzleService } from '../database/drizzle.service';
import { OutboxService } from '../events/outbox.service';
import {
  DeliveryStatus,
  LifecycleStateMachineService,
  OrderStatus,
} from './lifecycle-state-machine.service';

@Injectable()
export class LogisticsWorkflowService {
  constructor(
    private readonly drizzleService: DrizzleService,
    private readonly lifecycleStateMachine: LifecycleStateMachineService,
    private readonly outboxService: OutboxService,
  ) {}

  async updateOrderStatus(input: {
    orderId: string;
    nextStatus: OrderStatus;
    actorUserId?: string;
  }) {
    const existing = await this.drizzleService.db
      .select()
      .from(orders)
      .where(eq(orders.id, input.orderId))
      .limit(1);

    if (!existing.length) {
      throw new Error('Order not found');
    }

    const order = existing[0];
    this.lifecycleStateMachine.assertValidOrderTransition(
      order.status as OrderStatus,
      input.nextStatus,
    );

    const [updated] = await this.drizzleService.db
      .update(orders)
      .set({ status: input.nextStatus, updatedAt: new Date() })
      .where(eq(orders.id, input.orderId))
      .returning();

    await this.drizzleService.db.insert(statusEvents).values({
      entityType: 'ORDER',
      entityId: order.id,
      fromStatus: order.status,
      toStatus: input.nextStatus,
      actorUserId: input.actorUserId,
    });

    await this.outboxService.enqueue('order.status.changed', {
      orderId: updated.id,
      from: order.status,
      to: updated.status,
    });

    return updated;
  }

  async updateDeliveryStatus(input: {
    deliveryId: string;
    nextStatus: DeliveryStatus;
    actorUserId?: string;
    location?: { latitude: string; longitude: string; etaMinutes?: number };
  }) {
    const existing = await this.drizzleService.db
      .select()
      .from(deliveries)
      .where(eq(deliveries.id, input.deliveryId))
      .limit(1);
    if (!existing.length) {
      throw new Error('Delivery not found');
    }

    const delivery = existing[0];
    this.lifecycleStateMachine.assertValidDeliveryTransition(
      delivery.status as DeliveryStatus,
      input.nextStatus,
    );

    const [updated] = await this.drizzleService.db
      .update(deliveries)
      .set({
        status: input.nextStatus,
        currentLatitude: input.location?.latitude,
        currentLongitude: input.location?.longitude,
        etaMinutes: input.location?.etaMinutes,
        updatedAt: new Date(),
      })
      .where(eq(deliveries.id, input.deliveryId))
      .returning();

    await this.drizzleService.db.insert(statusEvents).values({
      entityType: 'DELIVERY',
      entityId: delivery.id,
      fromStatus: delivery.status,
      toStatus: input.nextStatus,
      actorUserId: input.actorUserId,
    });

    await this.outboxService.enqueue('delivery.status.changed', {
      deliveryId: updated.id,
      orderId: updated.orderId,
      to: updated.status,
    });

    return updated;
  }

  async markPaymentCaptured(paymentId: string) {
    const [updated] = await this.drizzleService.db
      .update(payments)
      .set({ status: 'CAPTURED', updatedAt: new Date() })
      .where(eq(payments.id, paymentId))
      .returning();

    if (updated) {
      await this.outboxService.enqueue('payment.captured', {
        paymentId: updated.id,
        orderId: updated.orderId,
      });
    }

    return updated ?? null;
  }
}
