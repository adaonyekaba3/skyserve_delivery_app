import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CartRepository } from '../cart.repository';
import { OrdersService } from 'src/modules/orders/application/orders.service';
import { PusherService } from 'src/shared/realtime/pusher.service';

export interface CartLineView {
  id: string;
  menuItemId: string;
  name: string;
  imageUrl: string | null;
  quantity: number;
  unitPrice: string;
  restaurantId: string;
}

export interface CartView {
  id: string;
  userId: string;
  restaurantId: string | null;
  items: CartLineView[];
  totalAmount: string;
}

@Injectable()
export class CartService {
  constructor(
    private readonly cartRepository: CartRepository,
    private readonly ordersService: OrdersService,
    private readonly pusherService: PusherService,
  ) {}

  private async ensureCart(userId: string, restaurantId: string) {
    const existing = await this.cartRepository.findCartByUserId(userId);
    if (existing.length) {
      const cart = existing[0];
      if (cart.restaurantId && cart.restaurantId !== restaurantId) {
        throw new ConflictException(
          'Cart already contains items from a different restaurant. Clear it first.',
        );
      }
      if (!cart.restaurantId) {
        const [updated] = await this.cartRepository.updateCartRestaurant(
          cart.id,
          restaurantId,
        );
        return updated;
      }
      return cart;
    }
    const [created] = await this.cartRepository.createCart({
      userId,
      restaurantId,
    });
    return created;
  }

  private async toView(cartId: string, userId: string): Promise<CartView> {
    const items = await this.cartRepository.listItems(cartId);
    let total = 0;
    const restaurantIds = new Set<string>();
    const view: CartLineView[] = items.map((line) => {
      total += Number(line.unitPrice) * line.quantity;
      restaurantIds.add(line.restaurantId);
      return {
        id: line.id,
        menuItemId: line.menuItemId,
        name: line.name,
        imageUrl: line.imageUrl,
        quantity: line.quantity,
        unitPrice: line.unitPrice,
        restaurantId: line.restaurantId,
      };
    });
    const restaurantId =
      restaurantIds.size === 1 ? [...restaurantIds][0] : null;
    return {
      id: cartId,
      userId,
      restaurantId,
      items: view,
      totalAmount: total.toFixed(2),
    };
  }

  async getMine(userId: string): Promise<CartView | null> {
    const existing = await this.cartRepository.findCartByUserId(userId);
    if (!existing.length) return null;
    return this.toView(existing[0].id, userId);
  }

  async addItem(
    userId: string,
    input: { menuItemId: string; quantity: number },
  ): Promise<CartView> {
    if (input.quantity <= 0) {
      throw new BadRequestException('Quantity must be > 0');
    }
    const menuRows = await this.cartRepository.findMenuItem(input.menuItemId);
    if (!menuRows.length) {
      throw new NotFoundException(`Menu item ${input.menuItemId} not found`);
    }
    const menu = menuRows[0];
    if (!menu.isAvailable) {
      throw new BadRequestException(`Menu item ${menu.name} is not available`);
    }
    const cart = await this.ensureCart(userId, menu.restaurantId);

    const existingItem = await this.cartRepository.findItemByCartAndMenu(
      cart.id,
      menu.id,
    );
    if (existingItem.length) {
      await this.cartRepository.updateItemQuantity(
        existingItem[0].id,
        existingItem[0].quantity + input.quantity,
      );
    } else {
      await this.cartRepository.insertItem({
        cartId: cart.id,
        menuItemId: menu.id,
        quantity: input.quantity,
        unitPrice: menu.price,
      });
    }
    await this.cartRepository.touchCart(cart.id);
    const view = await this.toView(cart.id, userId);
    await this.publishCartCount(view);
    return view;
  }

  async setItemQuantity(
    userId: string,
    itemId: string,
    quantity: number,
  ): Promise<CartView | null> {
    const existing = await this.cartRepository.findCartByUserId(userId);
    if (!existing.length) {
      throw new NotFoundException('Cart not found');
    }
    const cart = existing[0];

    if (quantity <= 0) {
      const [removed] = await this.cartRepository.deleteItem(itemId);
      if (!removed) {
        throw new NotFoundException(`Cart item ${itemId} not found`);
      }
    } else {
      const [updated] = await this.cartRepository.updateItemQuantity(
        itemId,
        quantity,
      );
      if (!updated) {
        throw new NotFoundException(`Cart item ${itemId} not found`);
      }
    }
    await this.cartRepository.touchCart(cart.id);
    const view = await this.toView(cart.id, userId);
    await this.publishCartCount(view);
    return view;
  }

  async clear(userId: string): Promise<{ ok: true }> {
    const existing = await this.cartRepository.findCartByUserId(userId);
    if (!existing.length) return { ok: true };
    const cart = existing[0];
    await this.cartRepository.deleteAllItemsForCart(cart.id);
    await this.cartRepository.updateCartRestaurant(cart.id, null);
    await this.cartRepository.touchCart(cart.id);
    await this.pusherService.trigger('private-admin', 'cart_updated', {
      userId,
      itemCount: 0,
    });
    return { ok: true };
  }

  async checkout(
    userId: string,
    input: {
      deliveryAddress: string;
      deliveryLatitude?: string;
      deliveryLongitude?: string;
    },
  ) {
    const view = await this.getMine(userId);
    if (!view || view.items.length === 0) {
      throw new BadRequestException('Cart is empty');
    }
    if (!view.restaurantId) {
      throw new ConflictException('Cart has no restaurant context');
    }
    const created = await this.ordersService.create({
      customerId: userId,
      restaurantId: view.restaurantId,
      deliveryAddress: input.deliveryAddress,
      deliveryLatitude: input.deliveryLatitude,
      deliveryLongitude: input.deliveryLongitude,
      items: view.items.map((line) => ({
        menuItemId: line.menuItemId,
        quantity: line.quantity,
      })),
    });
    await this.clear(userId);
    return created;
  }

  private async publishCartCount(view: CartView) {
    const itemCount = view.items.reduce((acc, line) => acc + line.quantity, 0);
    await this.pusherService.trigger('private-admin', 'cart_updated', {
      userId: view.userId,
      itemCount,
      restaurantId: view.restaurantId,
    });
  }
}
