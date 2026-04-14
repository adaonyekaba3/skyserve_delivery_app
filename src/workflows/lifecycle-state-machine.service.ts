import { ConflictException, Injectable } from '@nestjs/common';
import { DeliveryStatus, OrderStatus } from '@prisma/client';

@Injectable()
export class LifecycleStateMachineService {
  private readonly allowedOrderTransitions: Record<OrderStatus, OrderStatus[]> =
    {
      [OrderStatus.PENDING]: [OrderStatus.ACCEPTED, OrderStatus.CANCELLED],
      [OrderStatus.ACCEPTED]: [OrderStatus.PREPARING, OrderStatus.CANCELLED],
      [OrderStatus.PREPARING]: [OrderStatus.PICKED_UP, OrderStatus.CANCELLED],
      [OrderStatus.PICKED_UP]: [OrderStatus.IN_FLIGHT],
      [OrderStatus.IN_FLIGHT]: [OrderStatus.DELIVERED],
      [OrderStatus.DELIVERED]: [],
      [OrderStatus.CANCELLED]: [],
    };

  private readonly allowedDeliveryTransitions: Record<
    DeliveryStatus,
    DeliveryStatus[]
  > = {
    [DeliveryStatus.ASSIGNED]: [
      DeliveryStatus.PICKED_UP,
      DeliveryStatus.CANCELLED,
      DeliveryStatus.FAILED,
    ],
    [DeliveryStatus.PICKED_UP]: [
      DeliveryStatus.IN_FLIGHT,
      DeliveryStatus.FAILED,
    ],
    [DeliveryStatus.IN_FLIGHT]: [
      DeliveryStatus.DELIVERED,
      DeliveryStatus.FAILED,
    ],
    [DeliveryStatus.DELIVERED]: [],
    [DeliveryStatus.FAILED]: [],
    [DeliveryStatus.CANCELLED]: [],
  };

  assertValidOrderTransition(current: OrderStatus, next: OrderStatus) {
    if (current === next) {
      return;
    }

    const allowed = this.allowedOrderTransitions[current] ?? [];
    if (!allowed.includes(next)) {
      throw new ConflictException(
        `Invalid order transition: ${current} -> ${next}`,
      );
    }
  }

  assertValidDeliveryTransition(current: DeliveryStatus, next: DeliveryStatus) {
    if (current === next) {
      return;
    }

    const allowed = this.allowedDeliveryTransitions[current] ?? [];
    if (!allowed.includes(next)) {
      throw new ConflictException(
        `Invalid delivery transition: ${current} -> ${next}`,
      );
    }
  }
}
