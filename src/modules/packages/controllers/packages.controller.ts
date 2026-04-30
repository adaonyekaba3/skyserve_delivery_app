import {
  Body,
  Controller,
  Get,
  Param,
  Post,
} from '@nestjs/common';
import {
  IsBoolean,
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { CurrentUser } from 'src/modules/identity/guards/current-user.decorator';
import { Public } from 'src/modules/identity/guards/public.decorator';
import { Roles } from 'src/modules/identity/guards/roles.decorator';
import { AuthenticatedUser } from 'src/shared/types/authenticated-user';
import { Role } from 'src/shared/types/role.enum';
import { PackagesService } from '../application/packages.service';

const CATEGORIES = ['documents', 'food', 'parcel', 'gift', 'other'] as const;
const WEIGHTS = ['light', 'medium', 'heavy'] as const;
const PRIORITIES = ['standard', 'priority'] as const;

class QuoteDto {
  @IsIn(WEIGHTS)
  weightClass!: (typeof WEIGHTS)[number];

  @IsIn(PRIORITIES)
  deliveryPriority!: (typeof PRIORITIES)[number];
}

class LookupRecipientDto {
  @IsString()
  phone!: string;
}

class CreatePackageDto {
  @IsString()
  recipientPhone!: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  recipientName?: string;

  @IsIn(CATEGORIES)
  category!: (typeof CATEGORIES)[number];

  @IsIn(WEIGHTS)
  weightClass!: (typeof WEIGHTS)[number];

  @IsIn(PRIORITIES)
  deliveryPriority!: (typeof PRIORITIES)[number];

  @IsOptional()
  @IsBoolean()
  isFragile?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @IsString()
  pickupAddress!: string;

  @IsOptional()
  @IsString()
  pickupLatitude?: string;

  @IsOptional()
  @IsString()
  pickupLongitude?: string;

  @IsString()
  dropoffAddress!: string;

  @IsOptional()
  @IsString()
  dropoffLatitude?: string;

  @IsOptional()
  @IsString()
  dropoffLongitude?: string;
}

@Controller({ path: 'packages', version: '1' })
export class PackagesController {
  constructor(private readonly packagesService: PackagesService) {}

  @Roles(Role.ADMIN, Role.CUSTOMER)
  @Post('quote')
  quote(@Body() dto: QuoteDto) {
    return this.packagesService.quote(dto);
  }

  @Roles(Role.ADMIN, Role.CUSTOMER)
  @Post('lookup-recipient')
  lookup(@Body() dto: LookupRecipientDto) {
    return this.packagesService.lookupRecipient(dto.phone);
  }

  @Roles(Role.ADMIN, Role.CUSTOMER)
  @Post()
  create(
    @Body() dto: CreatePackageDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.packagesService.create({
      senderId: user.dbUserId,
      recipientPhone: dto.recipientPhone,
      recipientName: dto.recipientName ?? null,
      category: dto.category,
      weightClass: dto.weightClass,
      deliveryPriority: dto.deliveryPriority,
      isFragile: dto.isFragile,
      description: dto.description ?? null,
      pickupAddress: dto.pickupAddress,
      pickupLatitude: dto.pickupLatitude ?? null,
      pickupLongitude: dto.pickupLongitude ?? null,
      dropoffAddress: dto.dropoffAddress,
      dropoffLatitude: dto.dropoffLatitude ?? null,
      dropoffLongitude: dto.dropoffLongitude ?? null,
    });
  }

  @Roles(Role.ADMIN, Role.CUSTOMER)
  @Get('mine')
  listMine(@CurrentUser() user: AuthenticatedUser) {
    return this.packagesService.getMine(user.dbUserId);
  }

  @Roles(Role.ADMIN, Role.OPERATIONS)
  @Get('all')
  listAll() {
    return this.packagesService.listAllForAdmin();
  }

  @Public()
  @Get('track/:token')
  track(@Param('token') token: string) {
    return this.packagesService.getByTrackingToken(token);
  }

  @Get(':id')
  findById(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.packagesService.getById(user.dbUserId, user.role, id);
  }
}
