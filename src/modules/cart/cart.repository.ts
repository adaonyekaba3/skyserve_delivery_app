import { Injectable } from '@nestjs/common';
import { and, asc, eq } from 'drizzle-orm';
import { cartItems, carts, menuItems } from '../../../drizzle/schema';
import { BaseRepository } from 'src/shared/database/base.repository';

@Injectable()
export class CartRepository extends BaseRepository {
  findCartByUserId(userId: string) {
    return this.db
      .select()
      .from(carts)
      .where(eq(carts.userId, userId))
      .limit(1);
  }

  createCart(input: { userId: string; restaurantId: string }) {
    return this.db.insert(carts).values(input).returning();
  }

  updateCartRestaurant(cartId: string, restaurantId: string | null) {
    return this.db
      .update(carts)
      .set({ restaurantId, updatedAt: new Date() })
      .where(eq(carts.id, cartId))
      .returning();
  }

  touchCart(cartId: string) {
    return this.db
      .update(carts)
      .set({ updatedAt: new Date() })
      .where(eq(carts.id, cartId))
      .returning();
  }

  deleteCart(cartId: string) {
    return this.db.delete(carts).where(eq(carts.id, cartId)).returning();
  }

  listItems(cartId: string) {
    return this.db
      .select({
        id: cartItems.id,
        cartId: cartItems.cartId,
        menuItemId: cartItems.menuItemId,
        quantity: cartItems.quantity,
        unitPrice: cartItems.unitPrice,
        addedAt: cartItems.addedAt,
        name: menuItems.name,
        imageUrl: menuItems.imageUrl,
        restaurantId: menuItems.restaurantId,
      })
      .from(cartItems)
      .innerJoin(menuItems, eq(cartItems.menuItemId, menuItems.id))
      .where(eq(cartItems.cartId, cartId))
      .orderBy(asc(cartItems.addedAt));
  }

  findMenuItem(menuItemId: string) {
    return this.db
      .select()
      .from(menuItems)
      .where(eq(menuItems.id, menuItemId))
      .limit(1);
  }

  findItemByCartAndMenu(cartId: string, menuItemId: string) {
    return this.db
      .select()
      .from(cartItems)
      .where(
        and(eq(cartItems.cartId, cartId), eq(cartItems.menuItemId, menuItemId)),
      )
      .limit(1);
  }

  insertItem(input: {
    cartId: string;
    menuItemId: string;
    quantity: number;
    unitPrice: string;
  }) {
    return this.db.insert(cartItems).values(input).returning();
  }

  updateItemQuantity(itemId: string, quantity: number) {
    return this.db
      .update(cartItems)
      .set({ quantity })
      .where(eq(cartItems.id, itemId))
      .returning();
  }

  deleteItem(itemId: string) {
    return this.db
      .delete(cartItems)
      .where(eq(cartItems.id, itemId))
      .returning();
  }

  deleteAllItemsForCart(cartId: string) {
    return this.db
      .delete(cartItems)
      .where(eq(cartItems.cartId, cartId))
      .returning();
  }
}
