import { RestaurantStatus } from '@prisma/client';
import { IsEnum, IsOptional, IsUUID } from 'class-validator';
import { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';

export class ListRestaurantsDto extends PaginationQueryDto {
  @IsOptional()
  @IsEnum(RestaurantStatus)
  status?: RestaurantStatus;

  @IsOptional()
  @IsUUID()
  ownerId?: string;
}
