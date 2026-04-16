import { ConflictException } from '@nestjs/common';
import { DeliveryStatus, DroneStatus, OrderStatus } from '@prisma/client';
import { LogisticsWorkflowService } from 'src/workflows/logistics-workflow.service';
import { LifecycleStateMachineService } from 'src/workflows/lifecycle-state-machine.service';

describe('Logistics Workflow Integration', () => {
  const prisma = {
    order: {
      findUnique: jest.fn(),
    },
    drone: {
      findUnique: jest.fn(),
    },
    delivery: {
      findUnique: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  let service: LogisticsWorkflowService;

  beforeEach(() => {
    jest.clearAllMocks();
    prisma.$transaction.mockImplementation(
      async (callback: (arg: never) => unknown) => callback({} as never),
    );
    service = new LogisticsWorkflowService(
      prisma as never,
      new LifecycleStateMachineService(),
    );
  });

  it('rejects invalid delivery status transitions', async () => {
    prisma.delivery.findUnique.mockResolvedValue({
      id: 'delivery-1',
      orderId: 'order-1',
      droneId: 'drone-1',
      status: DeliveryStatus.ASSIGNED,
      pickedUpAt: null,
      inFlightAt: null,
      deliveredAt: null,
      order: { id: 'order-1', status: OrderStatus.PREPARING },
      drone: { id: 'drone-1', status: DroneStatus.ASSIGNED },
    });

    await expect(
      service.updateDeliveryProgress('delivery-1', {
        status: DeliveryStatus.DELIVERED,
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('rejects order fulfillment states without delivery invariants', async () => {
    prisma.order.findUnique.mockResolvedValue({
      id: 'order-1',
      status: OrderStatus.PREPARING,
      delivery: null,
    });

    await expect(
      service.updateOrderStatus('order-1', OrderStatus.PICKED_UP),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('creates delivery assignment plus status history atomically', async () => {
    prisma.order.findUnique.mockResolvedValue({
      id: 'order-1',
      status: OrderStatus.ACCEPTED,
    });
    prisma.drone.findUnique.mockResolvedValue({
      id: 'drone-1',
      status: DroneStatus.IDLE,
    });
    prisma.delivery.findUnique.mockResolvedValue(null);

    const tx = {
      delivery: {
        create: jest.fn().mockResolvedValue({ id: 'delivery-1' }),
        findUniqueOrThrow: jest.fn().mockResolvedValue({ id: 'delivery-1' }),
      },
      drone: {
        update: jest.fn().mockResolvedValue(undefined),
      },
      statusEvent: {
        create: jest.fn().mockResolvedValue(undefined),
      },
    };

    prisma.$transaction.mockImplementation(
      async (callback: (arg: typeof tx) => unknown) => callback(tx),
    );

    await service.assignDelivery({
      orderId: 'order-1',
      droneId: 'drone-1',
      etaMinutes: 10,
    });

    expect(tx.delivery.create).toHaveBeenCalled();
    expect(tx.drone.update).toHaveBeenCalledWith({
      where: { id: 'drone-1' },
      data: { status: DroneStatus.ASSIGNED },
    });
    expect(tx.statusEvent.create).toHaveBeenCalledTimes(2);
  });
});
