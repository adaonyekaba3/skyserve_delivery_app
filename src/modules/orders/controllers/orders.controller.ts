import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { IsString, IsUUID } from 'class-validator';
import { OrdersService } from '../application/orders.service';
import { Roles } from 'src/modules/identity/guards/roles.decorator';
import { Role } from 'src/shared/types/role.enum';
import { CurrentUser } from 'src/modules/identity/guards/current-user.decorator';
import { AuthenticatedUser } from 'src/shared/types/authenticated-user';

class CreateOrderDto {
  @IsUUID()
  restaurantId!: string;

  @IsString()
  totalAmount!: string;

  @IsString()
  deliveryAddress!: string;
}

@Controller({ path: 'orders', version: '1' })
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Roles(Role.ADMIN, Role.CUSTOMER)
  @Post()
  create(@Body() dto: CreateOrderDto, @CurrentUser() user: AuthenticatedUser) {
    return this.ordersService.create({
      customerId: user.sub,
      restaurantId: dto.restaurantId,
      totalAmount: dto.totalAmount,
      deliveryAddress: dto.deliveryAddress,
    });
  }

  @Roles(Role.ADMIN, Role.OPERATIONS, Role.RESTAURANT_OWNER)
  @Get()
  list() {
    return this.ordersService.listRecent();
  }

  @Get(':id')
  findById(@Param('id') id: string) {
    return this.ordersService.findById(id);
  }

  @Roles(Role.ADMIN, Role.OPERATIONS)
  @Patch(':id/status/:status')
  updateStatus(
    @Param('id') id: string,
    @Param('status')
    status:
      | 'PENDING'
      | 'ACCEPTED'
      | 'PREPARING'
      | 'PICKED_UP'
      | 'IN_FLIGHT'
      | 'DELIVERED'
      | 'CANCELLED',
  ) {
    return this.ordersService.updateStatus(id, status);
  }
}
