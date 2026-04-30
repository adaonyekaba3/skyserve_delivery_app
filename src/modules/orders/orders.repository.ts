import { Injectable } from '@nestjs/common';
import { desc, eq } from 'drizzle-orm';
import { orderItems, orders } from '../../../drizzle/schema';
import { BaseRepository } from 'src/shared/database/base.repository';

@Injectable()
export class OrdersRepository extends BaseRepository {
  findRecent(limit = 50) {
    return this.db
      .select()
      .from(orders)
      .orderBy(desc(orders.createdAt))
      .limit(limit);
  }

  findById(id: string) {
    return this.db.select().from(orders).where(eq(orders.id, id)).limit(1);
  }

  findByCustomer(customerId: string, limit = 50) {
    return this.db
      .select()
      .from(orders)
      .where(eq(orders.customerId, customerId))
      .orderBy(desc(orders.createdAt))
      .limit(limit);
  }

  findByRestaurant(restaurantId: string, limit = 100) {
    return this.db
      .select()
      .from(orders)
      .where(eq(orders.restaurantId, restaurantId))
      .orderBy(desc(orders.createdAt))
      .limit(limit);
  }

  findItems(orderId: string) {
    return this.db
      .select()
      .from(orderItems)
      .where(eq(orderItems.orderId, orderId));
  }
}
