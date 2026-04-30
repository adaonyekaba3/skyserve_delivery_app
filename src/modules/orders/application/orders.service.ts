import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { eq, inArray } from 'drizzle-orm';
import { menuItems, orderItems, orders } from '../../../../drizzle/schema';
import { DrizzleService } from 'src/shared/database/drizzle.service';
import { LogisticsWorkflowService } from 'src/shared/workflows/logistics-workflow.service';
import { PusherService } from 'src/shared/realtime/pusher.service';
import { OrdersRepository } from '../orders.repository';

export interface CreateOrderInput {
  customerId: string;
  restaurantId: string;
  deliveryAddress: string;
  deliveryLatitude?: string;
  deliveryLongitude?: string;
  items: Array<{ menuItemId: string; quantity: number }>;
}

@Injectable()
export class OrdersService {
  constructor(
    private readonly ordersRepository: OrdersRepository,
    private readonly drizzleService: DrizzleService,
    private readonly logisticsWorkflowService: LogisticsWorkflowService,
    private readonly pusherService: PusherService,
  ) {}

  listRecent() {
    return this.ordersRepository.findRecent();
  }

  listMine(customerId: string) {
    return this.ordersRepository.findByCustomer(customerId);
  }

  listByRestaurant(restaurantId: string) {
    return this.ordersRepository.findByRestaurant(restaurantId);
  }

  async findById(orderId: string) {
    const rows = await this.drizzleService.db
      .select()
      .from(orders)
      .where(eq(orders.id, orderId))
      .limit(1);
    return rows[0] ?? null;
  }

  async findWithItems(orderId: string) {
    const order = await this.findById(orderId);
    if (!order) {
      return null;
    }
    const items = await this.ordersRepository.findItems(orderId);
    return { ...order, items };
  }

  async create(input: CreateOrderInput) {
    if (!input.items?.length) {
      throw new BadRequestException('Order must contain at least one item');
    }

    const ids = input.items.map((i) => i.menuItemId);
    const menuRows = await this.drizzleService.db
      .select()
      .from(menuItems)
      .where(inArray(menuItems.id, ids));
    const byId = new Map(menuRows.map((m) => [m.id, m]));

    let total = 0;
    const linePayloads = input.items.map((line) => {
      const menu = byId.get(line.menuItemId);
      if (!menu) {
        throw new BadRequestException(
          `Menu item not found: ${line.menuItemId}`,
        );
      }
      if (menu.restaurantId !== input.restaurantId) {
        throw new BadRequestException(
          `Menu item ${menu.id} does not belong to restaurant ${input.restaurantId}`,
        );
      }
      const unitPrice = Number(menu.price);
      total += unitPrice * line.quantity;
      return {
        menuItemId: menu.id,
        quantity: line.quantity,
        unitPrice: menu.price,
        nameSnapshot: menu.name,
      };
    });

    const created = await this.drizzleService.db.transaction(async (tx) => {
      const [order] = await tx
        .insert(orders)
        .values({
          customerId: input.customerId,
          restaurantId: input.restaurantId,
          totalAmount: total.toFixed(2),
          deliveryAddress: input.deliveryAddress,
          deliveryLatitude: input.deliveryLatitude,
          deliveryLongitude: input.deliveryLongitude,
        })
        .returning();

      await tx.insert(orderItems).values(
        linePayloads.map((line) => ({
          orderId: order.id,
          menuItemId: line.menuItemId,
          quantity: line.quantity,
          unitPrice: line.unitPrice,
          nameSnapshot: line.nameSnapshot,
        })),
      );

      return order;
    });

    const items = await this.ordersRepository.findItems(created.id);
    const payload = { ...created, items };

    await Promise.all([
      this.pusherService.trigger(
        `private-restaurant-${created.restaurantId}`,
        'order_created',
        payload,
      ),
      this.pusherService.trigger(
        `private-customer-${created.customerId}`,
        'order_status_updated',
        payload,
      ),
      this.pusherService.trigger('orders', 'order_status_updated', payload),
      this.pusherService.trigger('private-admin', 'order_changed', {
        type: 'created',
        order: payload,
      }),
    ]);

    return payload;
  }

  async updateStatus(
    orderId: string,
    nextStatus: Parameters<
      LogisticsWorkflowService['updateOrderStatus']
    >[0]['nextStatus'],
    actorUserId?: string,
  ) {
    const updated = await this.logisticsWorkflowService.updateOrderStatus({
      orderId,
      nextStatus,
      actorUserId,
    });

    if (!updated) {
      throw new NotFoundException(`Order ${orderId} not found`);
    }

    await Promise.all([
      this.pusherService.trigger(
        `private-customer-${updated.customerId}`,
        'order_status_updated',
        updated,
      ),
      this.pusherService.trigger(
        `private-restaurant-${updated.restaurantId}`,
        'order_status_updated',
        updated,
      ),
      this.pusherService.trigger('orders', 'order_status_updated', updated),
      this.pusherService.trigger('private-admin', 'order_changed', {
        type: 'status_updated',
        order: updated,
      }),
    ]);

    return updated;
  }
}
