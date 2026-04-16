import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  DeliveryStatus,
  DroneStatus,
  OrderStatus,
  Prisma,
  StatusEntityType,
} from '@prisma/client';
import { AuthenticatedUser } from 'src/common/decorators/current-user.decorator';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateDeliveryDto } from 'src/deliveries/dto/create-delivery.dto';
import { UpdateDeliveryDto } from 'src/deliveries/dto/update-delivery.dto';
import { LifecycleStateMachineService } from './lifecycle-state-machine.service';

@Injectable()
export class LogisticsWorkflowService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly lifecycleStateMachine: LifecycleStateMachineService,
  ) {}

  private readonly assignableOrderStatuses: OrderStatus[] = [
    OrderStatus.PENDING,
    OrderStatus.ACCEPTED,
    OrderStatus.PREPARING,
  ];

  async assignDelivery(dto: CreateDeliveryDto, actor?: AuthenticatedUser) {
    const [order, drone, existingDelivery] = await Promise.all([
      this.prisma.order.findUnique({ where: { id: dto.orderId } }),
      this.prisma.drone.findUnique({ where: { id: dto.droneId } }),
      this.prisma.delivery.findUnique({ where: { orderId: dto.orderId } }),
    ]);

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (!drone) {
      throw new NotFoundException('Drone not found');
    }

    if (existingDelivery) {
      throw new ConflictException('Delivery already exists for this order');
    }

    if (!this.assignableOrderStatuses.includes(order.status)) {
      throw new ConflictException(
        'Order is not eligible for delivery assignment',
      );
    }

    if (drone.status !== DroneStatus.IDLE) {
      throw new ConflictException('Drone is not available for assignment');
    }

    return this.prisma.$transaction(async (tx) => {
      const createdDelivery = await tx.delivery.create({
        data: {
          orderId: dto.orderId,
          droneId: dto.droneId,
          etaMinutes: dto.etaMinutes,
          status: DeliveryStatus.ASSIGNED,
        },
      });

      await tx.drone.update({
        where: { id: dto.droneId },
        data: { status: DroneStatus.ASSIGNED },
      });

      await this.createStatusEvent(tx, {
        entityType: StatusEntityType.DELIVERY,
        entityId: createdDelivery.id,
        fromStatus: null,
        toStatus: DeliveryStatus.ASSIGNED,
        actorUserId: actor?.sub,
        metadata: { orderId: dto.orderId, droneId: dto.droneId },
      });

      await this.createStatusEvent(tx, {
        entityType: StatusEntityType.DRONE,
        entityId: dto.droneId,
        fromStatus: drone.status,
        toStatus: DroneStatus.ASSIGNED,
        actorUserId: actor?.sub,
      });

      return tx.delivery.findUniqueOrThrow({
        where: { id: createdDelivery.id },
        include: {
          order: true,
          drone: true,
        },
      });
    });
  }

  async updateDeliveryProgress(
    id: string,
    dto: UpdateDeliveryDto,
    actor?: AuthenticatedUser,
  ) {
    const delivery = await this.prisma.delivery.findUnique({
      where: { id },
      include: {
        order: true,
        drone: true,
      },
    });

    if (!delivery) {
      throw new NotFoundException('Delivery not found');
    }

    const deliveryData: Prisma.DeliveryUpdateInput = {
      ...(dto.status && { status: dto.status }),
      ...(dto.currentLatitude !== undefined && {
        currentLatitude: dto.currentLatitude,
      }),
      ...(dto.currentLongitude !== undefined && {
        currentLongitude: dto.currentLongitude,
      }),
      ...(dto.etaMinutes !== undefined && {
        etaMinutes: dto.etaMinutes,
      }),
    };

    if (dto.status) {
      this.lifecycleStateMachine.assertValidDeliveryTransition(
        delivery.status,
        dto.status,
      );
    }

    if (dto.status === DeliveryStatus.PICKED_UP && !delivery.pickedUpAt) {
      deliveryData.pickedUpAt = new Date();
    }

    if (dto.status === DeliveryStatus.IN_FLIGHT && !delivery.inFlightAt) {
      deliveryData.inFlightAt = new Date();
    }

    if (dto.status === DeliveryStatus.DELIVERED && !delivery.deliveredAt) {
      deliveryData.deliveredAt = new Date();
    }

    return this.prisma.$transaction(async (tx) => {
      await tx.delivery.update({
        where: { id },
        data: deliveryData,
      });

      if (
        dto.currentLatitude !== undefined &&
        dto.currentLongitude !== undefined
      ) {
        await tx.deliveryTelemetry.create({
          data: {
            deliveryId: id,
            latitude: dto.currentLatitude,
            longitude: dto.currentLongitude,
            etaMinutes: dto.etaMinutes,
          },
        });
      }

      if (dto.status) {
        const mappedOrderStatus = this.mapDeliveryStatusToOrderStatus(
          dto.status,
        );
        const mappedDroneStatus = this.mapDeliveryStatusToDroneStatus(
          dto.status,
        );

        if (mappedOrderStatus) {
          this.lifecycleStateMachine.assertValidOrderTransition(
            delivery.order.status,
            mappedOrderStatus,
          );
          await tx.order.update({
            where: { id: delivery.orderId },
            data: { status: mappedOrderStatus },
          });
          await this.createStatusEvent(tx, {
            entityType: StatusEntityType.ORDER,
            entityId: delivery.orderId,
            fromStatus: delivery.order.status,
            toStatus: mappedOrderStatus,
            actorUserId: actor?.sub,
            metadata: { deliveryId: id },
          });
        }

        if (mappedDroneStatus) {
          await tx.drone.update({
            where: { id: delivery.droneId },
            data: { status: mappedDroneStatus },
          });
          await this.createStatusEvent(tx, {
            entityType: StatusEntityType.DRONE,
            entityId: delivery.droneId,
            fromStatus: delivery.drone.status,
            toStatus: mappedDroneStatus,
            actorUserId: actor?.sub,
            metadata: { deliveryId: id },
          });
        }

        await this.createStatusEvent(tx, {
          entityType: StatusEntityType.DELIVERY,
          entityId: id,
          fromStatus: delivery.status,
          toStatus: dto.status,
          actorUserId: actor?.sub,
        });
      }

      return tx.delivery.findUniqueOrThrow({
        where: { id },
        include: {
          order: true,
          drone: true,
        },
      });
    });
  }

  async updateOrderStatus(
    id: string,
    nextStatus: OrderStatus,
    actor?: AuthenticatedUser,
  ) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: { delivery: true },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    this.lifecycleStateMachine.assertValidOrderTransition(
      order.status,
      nextStatus,
    );

    return this.prisma.$transaction(async (tx) => {
      if (
        nextStatus === OrderStatus.PICKED_UP ||
        nextStatus === OrderStatus.IN_FLIGHT ||
        nextStatus === OrderStatus.DELIVERED
      ) {
        if (!order.delivery) {
          throw new ConflictException(
            'Order must have a delivery before entering fulfillment states',
          );
        }

        const expectedDeliveryStatus =
          this.mapOrderStatusToDeliveryStatus(nextStatus);
        if (order.delivery.status !== expectedDeliveryStatus) {
          throw new ConflictException(
            `Order status ${nextStatus} requires delivery status ${expectedDeliveryStatus}`,
          );
        }
      }

      if (nextStatus === OrderStatus.CANCELLED && order.delivery) {
        if (
          order.delivery.status !== DeliveryStatus.DELIVERED &&
          order.delivery.status !== DeliveryStatus.CANCELLED
        ) {
          await tx.delivery.update({
            where: { id: order.delivery.id },
            data: { status: DeliveryStatus.CANCELLED },
          });
          await tx.drone.update({
            where: { id: order.delivery.droneId },
            data: { status: DroneStatus.IDLE },
          });
          await this.createStatusEvent(tx, {
            entityType: StatusEntityType.DELIVERY,
            entityId: order.delivery.id,
            fromStatus: order.delivery.status,
            toStatus: DeliveryStatus.CANCELLED,
            actorUserId: actor?.sub,
            metadata: { reason: 'order_cancelled' },
          });
          await this.createStatusEvent(tx, {
            entityType: StatusEntityType.DRONE,
            entityId: order.delivery.droneId,
            fromStatus: DroneStatus.ASSIGNED,
            toStatus: DroneStatus.IDLE,
            actorUserId: actor?.sub,
            metadata: { reason: 'order_cancelled' },
          });
        }
      }

      await tx.order.update({
        where: { id },
        data: { status: nextStatus },
      });

      await this.createStatusEvent(tx, {
        entityType: StatusEntityType.ORDER,
        entityId: id,
        fromStatus: order.status,
        toStatus: nextStatus,
        actorUserId: actor?.sub,
      });

      return tx.order.findUniqueOrThrow({
        where: { id },
        include: {
          customer: {
            select: {
              id: true,
              email: true,
              fullName: true,
              role: true,
              createdAt: true,
              updatedAt: true,
            },
          },
          restaurant: true,
          delivery: true,
        },
      });
    });
  }

  private mapDeliveryStatusToOrderStatus(status: DeliveryStatus) {
    switch (status) {
      case DeliveryStatus.PICKED_UP:
        return OrderStatus.PICKED_UP;
      case DeliveryStatus.IN_FLIGHT:
        return OrderStatus.IN_FLIGHT;
      case DeliveryStatus.DELIVERED:
        return OrderStatus.DELIVERED;
      case DeliveryStatus.CANCELLED:
      case DeliveryStatus.FAILED:
        return OrderStatus.CANCELLED;
      default:
        return undefined;
    }
  }

  private mapDeliveryStatusToDroneStatus(status: DeliveryStatus) {
    switch (status) {
      case DeliveryStatus.ASSIGNED:
      case DeliveryStatus.PICKED_UP:
        return DroneStatus.ASSIGNED;
      case DeliveryStatus.IN_FLIGHT:
        return DroneStatus.IN_FLIGHT;
      case DeliveryStatus.DELIVERED:
      case DeliveryStatus.CANCELLED:
      case DeliveryStatus.FAILED:
        return DroneStatus.IDLE;
      default:
        return undefined;
    }
  }

  private mapOrderStatusToDeliveryStatus(status: OrderStatus) {
    switch (status) {
      case OrderStatus.PICKED_UP:
        return DeliveryStatus.PICKED_UP;
      case OrderStatus.IN_FLIGHT:
        return DeliveryStatus.IN_FLIGHT;
      case OrderStatus.DELIVERED:
        return DeliveryStatus.DELIVERED;
      default:
        return DeliveryStatus.ASSIGNED;
    }
  }

  private createStatusEvent(
    tx: Prisma.TransactionClient,
    data: {
      entityType: StatusEntityType;
      entityId: string;
      fromStatus: string | null;
      toStatus: string;
      actorUserId?: string;
      reason?: string;
      metadata?: Prisma.InputJsonValue;
    },
  ) {
    return tx.statusEvent.create({
      data: {
        entityType: data.entityType,
        entityId: data.entityId,
        fromStatus: data.fromStatus ?? undefined,
        toStatus: data.toStatus,
        actorUserId: data.actorUserId,
        reason: data.reason,
        metadata: data.metadata,
      },
    });
  }
}
