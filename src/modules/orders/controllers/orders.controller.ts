import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import {
  ArrayMinSize,
  IsArray,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { OrdersService } from '../application/orders.service';
import { Roles } from 'src/modules/identity/guards/roles.decorator';
import { Role } from 'src/shared/types/role.enum';
import { CurrentUser } from 'src/modules/identity/guards/current-user.decorator';
import { AuthenticatedUser } from 'src/shared/types/authenticated-user';

class OrderLineDto {
  @IsUUID()
  menuItemId!: string;

  @IsInt()
  @Min(1)
  quantity!: number;
}

class CreateOrderDto {
  @IsUUID()
  restaurantId!: string;

  @IsString()
  deliveryAddress!: string;

  @IsOptional()
  @IsString()
  deliveryLatitude?: string;

  @IsOptional()
  @IsString()
  deliveryLongitude?: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => OrderLineDto)
  items!: OrderLineDto[];
}

@Controller({ path: 'orders', version: '1' })
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Roles(Role.ADMIN, Role.CUSTOMER)
  @Post()
  create(@Body() dto: CreateOrderDto, @CurrentUser() user: AuthenticatedUser) {
    return this.ordersService.create({
      customerId: user.dbUserId,
      restaurantId: dto.restaurantId,
      deliveryAddress: dto.deliveryAddress,
      deliveryLatitude: dto.deliveryLatitude,
      deliveryLongitude: dto.deliveryLongitude,
      items: dto.items,
    });
  }

  @Roles(Role.ADMIN, Role.OPERATIONS, Role.RESTAURANT_OWNER)
  @Get()
  list() {
    return this.ordersService.listRecent();
  }

  @Roles(Role.CUSTOMER, Role.ADMIN)
  @Get('mine')
  listMine(@CurrentUser() user: AuthenticatedUser) {
    return this.ordersService.listMine(user.dbUserId);
  }

  @Roles(Role.RESTAURANT_OWNER, Role.ADMIN, Role.OPERATIONS)
  @Get('by-restaurant/:restaurantId')
  listByRestaurant(
    @Param('restaurantId', new ParseUUIDPipe()) restaurantId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    if (
      user.role === Role.RESTAURANT_OWNER &&
      !user.restaurantIds.includes(restaurantId)
    ) {
      throw new ForbiddenException('You do not own this restaurant');
    }
    return this.ordersService.listByRestaurant(restaurantId);
  }

  @Get(':id')
  findById(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.ordersService.findWithItems(id).then((order) => {
      if (!order) return null;
      if (
        user.role === Role.CUSTOMER &&
        order.customerId !== user.dbUserId
      ) {
        throw new ForbiddenException('You do not own this order');
      }
      if (
        user.role === Role.RESTAURANT_OWNER &&
        !user.restaurantIds.includes(order.restaurantId)
      ) {
        throw new ForbiddenException('You do not own this restaurant');
      }
      return order;
    });
  }

  @Roles(Role.ADMIN, Role.OPERATIONS, Role.RESTAURANT_OWNER)
  @Patch(':id/status/:status')
  updateStatus(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Param('status')
    status:
      | 'PENDING'
      | 'ACCEPTED'
      | 'PREPARING'
      | 'PICKED_UP'
      | 'IN_FLIGHT'
      | 'DELIVERED'
      | 'CANCELLED',
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.ordersService.updateStatus(id, status, user.dbUserId);
  }
}
