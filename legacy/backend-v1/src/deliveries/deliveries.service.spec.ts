import { ForbiddenException } from '@nestjs/common';
import { Role } from 'src/common/enums/role.enum';
import { LogisticsWorkflowService } from 'src/workflows/logistics-workflow.service';
import { DeliveriesService } from './deliveries.service';

describe('DeliveriesService', () => {
  const prisma = {
    delivery: {
      findUnique: jest.fn(),
    },
  };
  const logisticsWorkflow = {
    assignDelivery: jest.fn(),
    updateDeliveryProgress: jest.fn(),
  } as unknown as LogisticsWorkflowService;

  let service: DeliveriesService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new DeliveriesService(prisma as never, logisticsWorkflow);
  });

  it('delegates delivery assignment to workflow service', async () => {
    await service.create(
      {
        orderId: 'order-1',
        droneId: 'drone-1',
        etaMinutes: 15,
      },
      {
        sub: 'ops-1',
        email: 'ops@example.com',
        role: Role.OPERATIONS,
      },
    );

    expect(logisticsWorkflow.assignDelivery).toHaveBeenCalledWith(
      expect.objectContaining({
        orderId: 'order-1',
        droneId: 'drone-1',
      }),
      expect.objectContaining({
        role: Role.OPERATIONS,
      }),
    );
  });

  it('rejects customer access to another user delivery', async () => {
    prisma.delivery.findUnique.mockResolvedValue({
      id: 'delivery-1',
      order: {
        id: 'order-1',
        customerId: 'other-user',
        restaurant: {
          ownerId: 'owner-2',
        },
      },
      drone: { id: 'drone-1' },
    });

    await expect(
      service.findOne('delivery-1', {
        sub: 'customer-1',
        email: 'customer@example.com',
        role: Role.CUSTOMER,
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });
});
