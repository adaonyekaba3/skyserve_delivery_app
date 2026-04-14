import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AuthenticatedUser } from 'src/common/decorators/current-user.decorator';
import { Role } from 'src/common/enums/role.enum';
import { PrismaService } from 'src/prisma/prisma.service';
import { LogisticsWorkflowService } from 'src/workflows/logistics-workflow.service';
import { CreateDeliveryDto } from './dto/create-delivery.dto';
import { ListDeliveriesDto } from './dto/list-deliveries.dto';
import { UpdateDeliveryDto } from './dto/update-delivery.dto';

@Injectable()
export class DeliveriesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logisticsWorkflow: LogisticsWorkflowService,
  ) {}

  create(dto: CreateDeliveryDto, user: AuthenticatedUser) {
    return this.logisticsWorkflow.assignDelivery(dto, user);
  }

  findAll(user: AuthenticatedUser, query: ListDeliveriesDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const sortBy = query.sortBy ?? 'createdAt';
    const sortOrder = query.sortOrder ?? 'desc';

    if (user.role === Role.ADMIN || user.role === Role.OPERATIONS) {
      return this.prisma.delivery.findMany({
        where: {
          ...(query.status && { status: query.status }),
          ...(query.droneId && { droneId: query.droneId }),
        },
        include: {
          order: true,
          drone: true,
        },
        orderBy: { [sortBy]: sortOrder } as never,
        skip: (page - 1) * limit,
        take: limit,
      });
    }

    if (user.role === Role.RESTAURANT_OWNER) {
      return this.prisma.delivery.findMany({
        where: {
          order: {
            restaurant: {
              ownerId: user.sub,
            },
          },
          ...(query.status && { status: query.status }),
          ...(query.droneId && { droneId: query.droneId }),
        },
        include: {
          order: true,
          drone: true,
        },
        orderBy: { [sortBy]: sortOrder } as never,
        skip: (page - 1) * limit,
        take: limit,
      });
    }

    return this.prisma.delivery.findMany({
      where: {
        order: {
          customerId: user.sub,
        },
        ...(query.status && { status: query.status }),
        ...(query.droneId && { droneId: query.droneId }),
      },
      include: {
        order: true,
        drone: true,
      },
      orderBy: { [sortBy]: sortOrder } as never,
      skip: (page - 1) * limit,
      take: limit,
    });
  }

  async findOne(id: string, user: AuthenticatedUser) {
    const delivery = await this.prisma.delivery.findUnique({
      where: { id },
      include: {
        order: {
          include: {
            restaurant: {
              select: { ownerId: true },
            },
          },
        },
        drone: true,
      },
    });

    if (!delivery) {
      throw new NotFoundException('Delivery not found');
    }

    if (
      user.role !== Role.ADMIN &&
      user.role !== Role.OPERATIONS &&
      !(
        user.role === Role.RESTAURANT_OWNER &&
        delivery.order.restaurant.ownerId === user.sub
      ) &&
      delivery.order.customerId !== user.sub
    ) {
      throw new ForbiddenException('You do not have access to this delivery');
    }

    return delivery;
  }

  update(id: string, dto: UpdateDeliveryDto, user: AuthenticatedUser) {
    return this.logisticsWorkflow.updateDeliveryProgress(id, dto, user);
  }
}
