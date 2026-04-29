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
  IsBoolean,
  IsNumberString,
  IsOptional,
  IsString,
  IsUrl,
  IsUUID,
} from 'class-validator';
import { Public } from 'src/modules/identity/guards/public.decorator';
import { RestaurantsService } from '../application/restaurants.service';
import { CurrentUser } from 'src/modules/identity/guards/current-user.decorator';
import { AuthenticatedUser } from 'src/shared/types/authenticated-user';
import { Roles } from 'src/modules/identity/guards/roles.decorator';
import { Role } from 'src/shared/types/role.enum';

class CreateRestaurantDto {
  @IsString()
  name!: string;

  @IsString()
  address!: string;

  @IsNumberString()
  latitude!: string;

  @IsNumberString()
  longitude!: string;
}

class UpdateRestaurantDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsNumberString()
  latitude?: string;

  @IsOptional()
  @IsNumberString()
  longitude?: string;
}

class CreateMenuItemDto {
  @IsUUID()
  restaurantId!: string;

  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsUrl()
  imageUrl?: string;

  @IsString()
  price!: string;

  @IsOptional()
  @IsBoolean()
  isAvailable?: boolean;
}

class UpdateMenuItemDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsUrl()
  imageUrl?: string;

  @IsOptional()
  @IsString()
  price?: string;

  @IsOptional()
  @IsBoolean()
  isAvailable?: boolean;
}

@Controller({ path: 'restaurants', version: '1' })
export class RestaurantsController {
  constructor(private readonly restaurantsService: RestaurantsService) {}

  @Public()
  @Get()
  list() {
    return this.restaurantsService.list();
  }

  @Public()
  @Get(':id')
  findById(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.restaurantsService.findById(id);
  }

  @Public()
  @Get(':id/menu')
  getMenu(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.restaurantsService.getMenu(id);
  }

  @Roles(Role.ADMIN, Role.OPERATIONS, Role.RESTAURANT_OWNER)
  @Post()
  createRestaurant(
    @Body() dto: CreateRestaurantDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.restaurantsService.createRestaurant(user, dto);
  }

  @Roles(Role.ADMIN, Role.OPERATIONS, Role.RESTAURANT_OWNER)
  @Patch(':id')
  updateRestaurant(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateRestaurantDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.restaurantsService.updateRestaurant(user, id, dto);
  }

  @Roles(Role.ADMIN, Role.OPERATIONS, Role.RESTAURANT_OWNER)
  @Delete(':id')
  deleteRestaurant(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.restaurantsService.deleteRestaurant(user, id);
  }

  @Roles(Role.ADMIN, Role.OPERATIONS, Role.RESTAURANT_OWNER)
  @Post('menu')
  createMenuItem(@Body() dto: CreateMenuItemDto, @CurrentUser() user: AuthenticatedUser) {
    return this.restaurantsService.createMenuItem(user, dto);
  }

  @Roles(Role.ADMIN, Role.OPERATIONS, Role.RESTAURANT_OWNER)
  @Patch('menu/:id')
  updateMenuItem(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateMenuItemDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.restaurantsService.updateMenuItem(user, id, dto);
  }

  @Roles(Role.ADMIN, Role.OPERATIONS, Role.RESTAURANT_OWNER)
  @Delete('menu/:id')
  deleteMenuItem(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.restaurantsService.deleteMenuItem(user, id);
  }
}
