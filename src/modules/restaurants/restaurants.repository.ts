import { Injectable } from '@nestjs/common';
import { and, asc, eq, gte, sql } from 'drizzle-orm';
import { menuItems, orders, restaurants } from '../../../drizzle/schema';
import { BaseRepository } from 'src/shared/database/base.repository';

@Injectable()
export class RestaurantsRepository extends BaseRepository {
  list(limit = 50) {
    return this.db
      .select()
      .from(restaurants)
      .orderBy(asc(restaurants.name))
      .limit(limit);
  }

  findById(id: string) {
    return this.db
      .select()
      .from(restaurants)
      .where(eq(restaurants.id, id))
      .limit(1);
  }

  listMenuFor(restaurantId: string) {
    return this.db
      .select()
      .from(menuItems)
      .where(eq(menuItems.restaurantId, restaurantId))
      .orderBy(asc(menuItems.name));
  }

  createRestaurant(input: {
    ownerId: string;
    name: string;
    address: string;
    latitude: string;
    longitude: string;
    category?: string | null;
    location?: string | null;
    isActive?: boolean;
  }) {
    return this.db.insert(restaurants).values(input).returning();
  }

  updateRestaurant(
    id: string,
    input: Partial<{
      name: string;
      address: string;
      latitude: string;
      longitude: string;
      category: string | null;
      location: string | null;
      isActive: boolean;
    }>,
  ) {
    return this.db
      .update(restaurants)
      .set({ ...input, updatedAt: new Date() })
      .where(eq(restaurants.id, id))
      .returning();
  }

  setActive(id: string, isActive: boolean) {
    return this.db
      .update(restaurants)
      .set({ isActive, updatedAt: new Date() })
      .where(eq(restaurants.id, id))
      .returning();
  }

  async performance(restaurantId: string) {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const [allTimeRow] = await this.db
      .select({
        count: sql<number>`count(*)::int`,
        avgTicket: sql<number>`coalesce(avg(${orders.totalAmount}), 0)::float`,
      })
      .from(orders)
      .where(eq(orders.restaurantId, restaurantId));

    const [weekRow] = await this.db
      .select({ count: sql<number>`count(*)::int` })
      .from(orders)
      .where(
        and(
          eq(orders.restaurantId, restaurantId),
          gte(orders.createdAt, sevenDaysAgo),
        ),
      );

    const [monthRow] = await this.db
      .select({ count: sql<number>`count(*)::int` })
      .from(orders)
      .where(
        and(
          eq(orders.restaurantId, restaurantId),
          gte(orders.createdAt, thirtyDaysAgo),
        ),
      );

    const [activeMenuRow] = await this.db
      .select({ count: sql<number>`count(*)::int` })
      .from(menuItems)
      .where(
        and(
          eq(menuItems.restaurantId, restaurantId),
          eq(menuItems.isAvailable, true),
        ),
      );

    const [fulfillmentRow] = await this.db
      .select({
        avgMinutes: sql<number>`coalesce(avg(extract(epoch from (${orders.updatedAt} - ${orders.createdAt})) / 60.0), 0)::float`,
      })
      .from(orders)
      .where(
        and(
          eq(orders.restaurantId, restaurantId),
          eq(orders.status, 'DELIVERED'),
        ),
      );

    return {
      ordersAllTime: Number(allTimeRow?.count ?? 0),
      ordersLast7d: Number(weekRow?.count ?? 0),
      ordersLast30d: Number(monthRow?.count ?? 0),
      avgTicketNgn: Number(allTimeRow?.avgTicket ?? 0),
      avgFulfillmentMinutes: Number(fulfillmentRow?.avgMinutes ?? 0),
      activeMenuItems: Number(activeMenuRow?.count ?? 0),
    };
  }

  deleteRestaurant(id: string) {
    return this.db
      .delete(restaurants)
      .where(eq(restaurants.id, id))
      .returning();
  }

  createMenuItem(input: {
    restaurantId: string;
    name: string;
    description?: string | null;
    imageUrl?: string | null;
    price: string;
    isAvailable?: boolean;
  }) {
    return this.db.insert(menuItems).values(input).returning();
  }

  updateMenuItem(
    id: string,
    input: Partial<{
      name: string;
      description: string | null;
      imageUrl: string | null;
      price: string;
      isAvailable: boolean;
    }>,
  ) {
    return this.db
      .update(menuItems)
      .set({ ...input, updatedAt: new Date() })
      .where(eq(menuItems.id, id))
      .returning();
  }

  deleteMenuItem(id: string) {
    return this.db.delete(menuItems).where(eq(menuItems.id, id)).returning();
  }

  findMenuItemById(id: string) {
    return this.db
      .select()
      .from(menuItems)
      .where(eq(menuItems.id, id))
      .limit(1);
  }
}
