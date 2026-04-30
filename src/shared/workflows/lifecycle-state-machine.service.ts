import { ConflictException, Injectable } from '@nestjs/common';

export type OrderStatus =
  | 'PENDING'
  | 'ACCEPTED'
  | 'PREPARING'
  | 'PICKED_UP'
  | 'IN_FLIGHT'
  | 'DELIVERED'
  | 'CANCELLED';

export type DeliveryStatus =
  | 'ASSIGNED'
  | 'PICKED_UP'
  | 'IN_FLIGHT'
  | 'DELIVERED'
  | 'FAILED'
  | 'CANCELLED';

@Injectable()
export class LifecycleStateMachineService {
  private readonly allowedOrderTransitions: Record<OrderStatus, OrderStatus[]> =
    {
      PENDING: ['ACCEPTED', 'CANCELLED'],
      ACCEPTED: ['PREPARING', 'CANCELLED'],
      PREPARING: ['PICKED_UP', 'CANCELLED'],
      PICKED_UP: ['IN_FLIGHT'],
      IN_FLIGHT: ['DELIVERED'],
      DELIVERED: [],
      CANCELLED: [],
    };

  private readonly allowedDeliveryTransitions: Record<
    DeliveryStatus,
    DeliveryStatus[]
  > = {
    ASSIGNED: ['PICKED_UP', 'FAILED', 'CANCELLED'],
    PICKED_UP: ['IN_FLIGHT', 'FAILED'],
    IN_FLIGHT: ['DELIVERED', 'FAILED'],
    DELIVERED: [],
    FAILED: [],
    CANCELLED: [],
  };

  assertValidOrderTransition(current: OrderStatus, next: OrderStatus) {
    if (current === next) return;
    const allowed = this.allowedOrderTransitions[current] ?? [];
    if (!allowed.includes(next)) {
      throw new ConflictException(
        `Invalid order transition: ${current} -> ${next}`,
      );
    }
  }

  assertValidDeliveryTransition(current: DeliveryStatus, next: DeliveryStatus) {
    if (current === next) return;
    const allowed = this.allowedDeliveryTransitions[current] ?? [];
    if (!allowed.includes(next)) {
      throw new ConflictException(
        `Invalid delivery transition: ${current} -> ${next}`,
      );
    }
  }
}
