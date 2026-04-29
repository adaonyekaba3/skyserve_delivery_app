import { Injectable } from '@nestjs/common';
import { asc, eq } from 'drizzle-orm';
import { menuItems, restaurants } from '../../../drizzle/schema';
import { BaseRepository } from 'src/shared/database/base.repository';

@Injectable()
export class RestaurantsRepository extends BaseRepository {
  list(limit = 50) {
    return this.db.select().from(restaurants).orderBy(asc(restaurants.name)).limit(limit);
  }

  findById(id: string) {
    return this.db.select().from(restaurants).where(eq(restaurants.id, id)).limit(1);
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
    }>,
  ) {
    return this.db
      .update(restaurants)
      .set({ ...input, updatedAt: new Date() })
      .where(eq(restaurants.id, id))
      .returning();
  }

  deleteRestaurant(id: string) {
    return this.db.delete(restaurants).where(eq(restaurants.id, id)).returning();
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
    return this.db.select().from(menuItems).where(eq(menuItems.id, id)).limit(1);
  }
}
