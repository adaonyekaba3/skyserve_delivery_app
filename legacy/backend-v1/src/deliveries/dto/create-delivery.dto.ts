import { IsInt, IsOptional, IsUUID, Min } from 'class-validator';

export class CreateDeliveryDto {
  @IsUUID()
  orderId!: string;

  @IsUUID()
  droneId!: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  etaMinutes?: number;
}
