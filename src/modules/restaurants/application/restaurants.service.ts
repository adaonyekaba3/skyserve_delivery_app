import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { RestaurantsRepository } from '../restaurants.repository';
import { Role } from 'src/shared/types/role.enum';
import { AuthenticatedUser } from 'src/shared/types/authenticated-user';
import { PusherService } from 'src/shared/realtime/pusher.service';

interface VendorInput {
  name: string;
  address: string;
  latitude: string;
  longitude: string;
  category?: string | null;
  location?: string | null;
  isActive?: boolean;
}

@Injectable()
export class RestaurantsService {
  constructor(
    private readonly restaurantsRepository: RestaurantsRepository,
    private readonly pusherService: PusherService,
  ) {}

  list() {
    return this.restaurantsRepository.list();
  }

  async findById(id: string) {
    const rows = await this.restaurantsRepository.findById(id);
    if (!rows.length) {
      throw new NotFoundException(`Restaurant ${id} not found`);
    }
    return rows[0];
  }

  getMenu(restaurantId: string) {
    return this.restaurantsRepository.listMenuFor(restaurantId);
  }

  private canManageRestaurant(user: AuthenticatedUser, restaurantId: string) {
    if (user.role === Role.ADMIN || user.role === Role.OPERATIONS) {
      return true;
    }
    if (
      user.role === Role.RESTAURANT_OWNER &&
      user.restaurantIds.includes(restaurantId)
    ) {
      return true;
    }
    return false;
  }

  async createRestaurant(user: AuthenticatedUser, input: VendorInput) {
    const ownerId =
      user.role === Role.RESTAURANT_OWNER ? user.dbUserId : user.dbUserId;
    const [created] = await this.restaurantsRepository.createRestaurant({
      ownerId,
      ...input,
    });
    await this.pusherService.trigger('private-admin', 'vendor_updated', {
      type: 'created',
      restaurant: created,
    });
    return created;
  }

  async updateRestaurant(
    user: AuthenticatedUser,
    id: string,
    input: Partial<VendorInput>,
  ) {
    if (!this.canManageRestaurant(user, id)) {
      throw new ForbiddenException('You do not own this restaurant');
    }
    const [updated] = await this.restaurantsRepository.updateRestaurant(
      id,
      input,
    );
    if (!updated) {
      throw new NotFoundException(`Restaurant ${id} not found`);
    }
    await this.pusherService.trigger('private-admin', 'vendor_updated', {
      type: 'updated',
      restaurant: updated,
    });
    return updated;
  }

  async setActive(user: AuthenticatedUser, id: string, isActive: boolean) {
    if (!this.canManageRestaurant(user, id)) {
      throw new ForbiddenException('You do not own this restaurant');
    }
    const [updated] = await this.restaurantsRepository.setActive(id, isActive);
    if (!updated) {
      throw new NotFoundException(`Restaurant ${id} not found`);
    }
    await this.pusherService.trigger('private-admin', 'vendor_updated', {
      type: 'active_changed',
      restaurant: updated,
    });
    return updated;
  }

  async getPerformance(user: AuthenticatedUser, id: string) {
    if (!this.canManageRestaurant(user, id)) {
      throw new ForbiddenException('You do not own this restaurant');
    }
    const exists = await this.restaurantsRepository.findById(id);
    if (!exists.length) {
      throw new NotFoundException(`Restaurant ${id} not found`);
    }
    return this.restaurantsRepository.performance(id);
  }

  async deleteRestaurant(user: AuthenticatedUser, id: string) {
    if (!this.canManageRestaurant(user, id)) {
      throw new ForbiddenException('You do not own this restaurant');
    }
    const [deleted] = await this.restaurantsRepository.deleteRestaurant(id);
    if (!deleted) {
      throw new NotFoundException(`Restaurant ${id} not found`);
    }
    return { ok: true };
  }

  async createMenuItem(
    user: AuthenticatedUser,
    input: {
      restaurantId: string;
      name: string;
      description?: string | null;
      imageUrl?: string | null;
      price: string;
      isAvailable?: boolean;
    },
  ) {
    if (!this.canManageRestaurant(user, input.restaurantId)) {
      throw new ForbiddenException('You do not own this restaurant');
    }
    const [created] = await this.restaurantsRepository.createMenuItem(input);
    return created;
  }

  async updateMenuItem(
    user: AuthenticatedUser,
    id: string,
    input: Partial<{
      name: string;
      description: string | null;
      imageUrl: string | null;
      price: string;
      isAvailable: boolean;
    }>,
  ) {
    const existing = await this.restaurantsRepository.findMenuItemById(id);
    if (!existing.length) {
      throw new NotFoundException(`Menu item ${id} not found`);
    }
    if (!this.canManageRestaurant(user, existing[0].restaurantId)) {
      throw new ForbiddenException('You do not own this restaurant');
    }
    const [updated] = await this.restaurantsRepository.updateMenuItem(
      id,
      input,
    );
    return updated;
  }

  async deleteMenuItem(user: AuthenticatedUser, id: string) {
    const existing = await this.restaurantsRepository.findMenuItemById(id);
    if (!existing.length) {
      throw new NotFoundException(`Menu item ${id} not found`);
    }
    if (!this.canManageRestaurant(user, existing[0].restaurantId)) {
      throw new ForbiddenException('You do not own this restaurant');
    }
    await this.restaurantsRepository.deleteMenuItem(id);
    return { ok: true };
  }
}
