import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import {
  IsInt,
  IsNumberString,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';
import { CartService } from '../application/cart.service';
import { CurrentUser } from 'src/modules/identity/guards/current-user.decorator';
import { AuthenticatedUser } from 'src/shared/types/authenticated-user';
import { Roles } from 'src/modules/identity/guards/roles.decorator';
import { Role } from 'src/shared/types/role.enum';

class AddItemDto {
  @IsUUID()
  menuItemId!: string;

  @IsInt()
  @Min(1)
  quantity!: number;
}

class SetItemQuantityDto {
  @IsInt()
  @Min(0)
  quantity!: number;
}

class CheckoutDto {
  @IsString()
  deliveryAddress!: string;

  @IsOptional()
  @IsNumberString()
  deliveryLatitude?: string;

  @IsOptional()
  @IsNumberString()
  deliveryLongitude?: string;
}

@Controller({ path: 'cart', version: '1' })
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Roles(Role.CUSTOMER, Role.ADMIN)
  @Get()
  getMine(@CurrentUser() user: AuthenticatedUser) {
    return this.cartService.getMine(user.dbUserId);
  }

  @Roles(Role.CUSTOMER, Role.ADMIN)
  @Post('items')
  addItem(@CurrentUser() user: AuthenticatedUser, @Body() dto: AddItemDto) {
    return this.cartService.addItem(user.dbUserId, dto);
  }

  @Roles(Role.CUSTOMER, Role.ADMIN)
  @Patch('items/:id')
  setQuantity(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: SetItemQuantityDto,
  ) {
    return this.cartService.setItemQuantity(user.dbUserId, id, dto.quantity);
  }

  @Roles(Role.CUSTOMER, Role.ADMIN)
  @Delete()
  clear(@CurrentUser() user: AuthenticatedUser) {
    return this.cartService.clear(user.dbUserId);
  }

  @Roles(Role.CUSTOMER, Role.ADMIN)
  @Post('checkout')
  checkout(@CurrentUser() user: AuthenticatedUser, @Body() dto: CheckoutDto) {
    return this.cartService.checkout(user.dbUserId, dto);
  }
}
