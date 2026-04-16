import {
  IsEnum,
  IsInt,
  IsLatitude,
  IsLongitude,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { DroneStatus } from '@prisma/client';

export class CreateDroneDto {
  @IsString()
  serialNumber!: string;

  @IsString()
  name!: string;

  @IsInt()
  @Min(0)
  @Max(100)
  batteryLevel!: number;

  @IsLatitude()
  latitude!: number;

  @IsLongitude()
  longitude!: number;

  @IsOptional()
  @IsEnum(DroneStatus)
  status?: DroneStatus;
}
