import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { OrderStatus } from '@prisma/client';
import { AuthenticatedUser } from 'src/common/decorators/current-user.decorator';
import { Role } from 'src/common/enums/role.enum';
import { PrismaService } from 'src/prisma/prisma.service';
import { LogisticsWorkflowService } from 'src/workflows/logistics-workflow.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { ListOrdersDto } from './dto/list-orders.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';

@Injectable()
export class OrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logisticsWorkflow: LogisticsWorkflowService,
  ) {}
  private readonly orderInclude = {
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
  } as const;

  async create(dto: CreateOrderDto, userId: string) {
    await this.ensureRestaurantExists(dto.restaurantId);

    return this.prisma.order.create({
      data: {
        customerId: userId,
        restaurantId: dto.restaurantId,
        totalAmount: dto.totalAmount,
        deliveryAddress: dto.deliveryAddress,
        notes: dto.notes,
        status: OrderStatus.PENDING,
      },
      include: this.orderInclude,
    });
  }

  findAll(user: AuthenticatedUser, query: ListOrdersDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const sortBy = query.sortBy ?? 'createdAt';
    const sortOrder = query.sortOrder ?? 'desc';

    if (user.role === Role.ADMIN || user.role === Role.OPERATIONS) {
      return this.prisma.order.findMany({
        where: {
          ...(query.status && { status: query.status }),
          ...(query.restaurantId && { restaurantId: query.restaurantId }),
        },
        include: this.orderInclude,
        orderBy: { [sortBy]: sortOrder } as never,
        skip: (page - 1) * limit,
        take: limit,
      });
    }

    if (user.role === Role.RESTAURANT_OWNER) {
      return this.prisma.order.findMany({
        where: {
          restaurant: { ownerId: user.sub },
          ...(query.status && { status: query.status }),
          ...(query.restaurantId && { restaurantId: query.restaurantId }),
        },
        include: this.orderInclude,
        orderBy: { [sortBy]: sortOrder } as never,
        skip: (page - 1) * limit,
        take: limit,
      });
    }

    return this.prisma.order.findMany({
      where: {
        customerId: user.sub,
        ...(query.status && { status: query.status }),
        ...(query.restaurantId && { restaurantId: query.restaurantId }),
      },
      include: this.orderInclude,
      orderBy: { [sortBy]: sortOrder } as never,
      skip: (page - 1) * limit,
      take: limit,
    });
  }

  async findOne(id: string, user: AuthenticatedUser) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: this.orderInclude,
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (
      user.role !== Role.ADMIN &&
      user.role !== Role.OPERATIONS &&
      !(
        user.role === Role.RESTAURANT_OWNER &&
        order.restaurant.ownerId === user.sub
      ) &&
      order.customerId !== user.sub
    ) {
      throw new ForbiddenException('You do not have access to this order');
    }

    return order;
  }

  updateStatus(id: string, dto: UpdateOrderStatusDto, user: AuthenticatedUser) {
    return this.logisticsWorkflow.updateOrderStatus(id, dto.status, user);
  }

  private async ensureRestaurantExists(id: string) {
    const restaurant = await this.prisma.restaurant.findUnique({
      where: { id },
    });

    if (!restaurant) {
      throw new NotFoundException('Restaurant not found');
    }
  }
}
