import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { OrderStatus } from '@prisma/client';
import { Role } from 'src/common/enums/role.enum';
import { LogisticsWorkflowService } from 'src/workflows/logistics-workflow.service';
import { OrdersService } from './orders.service';

describe('OrdersService', () => {
  const prisma = {
    restaurant: {
      findUnique: jest.fn(),
    },
    order: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  };
  const logisticsWorkflow = {
    updateOrderStatus: jest.fn(),
  } as unknown as LogisticsWorkflowService;

  let service: OrdersService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new OrdersService(prisma as never, logisticsWorkflow);
  });

  it('creates orders in pending state', async () => {
    prisma.restaurant.findUnique.mockResolvedValue({ id: 'restaurant-1' });
    prisma.order.create.mockResolvedValue({
      id: 'order-1',
      status: OrderStatus.PENDING,
    });

    await service.create(
      {
        restaurantId: 'restaurant-1',
        totalAmount: 25.5,
        deliveryAddress: 'Lekki Phase 1, Lagos',
        notes: 'leave at gate',
      },
      'user-1',
    );

    expect(prisma.order.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          customerId: 'user-1',
          restaurantId: 'restaurant-1',
          status: OrderStatus.PENDING,
        }),
      }),
    );
  });

  it('filters order list for customer users', async () => {
    prisma.order.findMany.mockResolvedValue([]);

    await service.findAll(
      {
        sub: 'user-1',
        email: 'customer@example.com',
        role: Role.CUSTOMER,
      },
      {},
    );

    expect(prisma.order.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { customerId: 'user-1' },
      }),
    );
  });

  it('rejects access to someone else’s order for non-operations roles', async () => {
    prisma.order.findUnique.mockResolvedValue({
      id: 'order-1',
      customerId: 'other-user',
      status: OrderStatus.PENDING,
      customer: { id: 'other-user' },
      restaurant: { id: 'restaurant-1' },
      delivery: null,
    });

    await expect(
      service.findOne('order-1', {
        sub: 'user-1',
        email: 'customer@example.com',
        role: Role.CUSTOMER,
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('throws if the requested order does not exist', async () => {
    prisma.order.findUnique.mockResolvedValue(null);

    await expect(
      service.findOne('missing-order', {
        sub: 'user-1',
        email: 'ops@example.com',
        role: Role.OPERATIONS,
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
