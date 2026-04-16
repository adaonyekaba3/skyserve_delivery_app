import { ForbiddenException } from '@nestjs/common';
import { Role } from 'src/common/enums/role.enum';
import { DeliveriesService } from 'src/deliveries/deliveries.service';
import { OrdersService } from 'src/orders/orders.service';

describe('Role Permission Integration', () => {
  it('allows restaurant owner to access own restaurant order', async () => {
    const prisma = {
      restaurant: { findUnique: jest.fn() },
      order: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'order-1',
          customerId: 'customer-1',
          restaurant: { id: 'restaurant-1', ownerId: 'owner-1' },
          delivery: null,
        }),
      },
    };
    const workflow = { updateOrderStatus: jest.fn() };
    const service = new OrdersService(prisma as never, workflow as never);

    const result = await service.findOne('order-1', {
      sub: 'owner-1',
      email: 'owner@example.com',
      role: Role.RESTAURANT_OWNER,
    });

    expect(result.id).toBe('order-1');
  });

  it('blocks restaurant owner from reading other owner delivery', async () => {
    const prisma = {
      delivery: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'delivery-1',
          order: {
            customerId: 'customer-1',
            restaurant: { ownerId: 'owner-2' },
          },
          drone: { id: 'drone-1' },
        }),
      },
    };
    const workflow = {
      assignDelivery: jest.fn(),
      updateDeliveryProgress: jest.fn(),
    };
    const service = new DeliveriesService(prisma as never, workflow as never);

    await expect(
      service.findOne('delivery-1', {
        sub: 'owner-1',
        email: 'owner@example.com',
        role: Role.RESTAURANT_OWNER,
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });
});
