import {
  IsEnum,
  IsInt,
  IsLatitude,
  IsLongitude,
  IsOptional,
  Min,
} from 'class-validator';
import { DeliveryStatus } from '@prisma/client';

export class UpdateDeliveryDto {
  @IsOptional()
  @IsEnum(DeliveryStatus)
  status?: DeliveryStatus;

  @IsOptional()
  @IsLatitude()
  currentLatitude?: number;

  @IsOptional()
  @IsLongitude()
  currentLongitude?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  etaMinutes?: number;
}
