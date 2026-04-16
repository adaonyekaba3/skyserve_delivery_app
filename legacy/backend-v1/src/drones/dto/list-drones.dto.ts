import { DroneStatus } from '@prisma/client';
import { IsEnum, IsOptional } from 'class-validator';
import { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';

export class ListDronesDto extends PaginationQueryDto {
  @IsOptional()
  @IsEnum(DroneStatus)
  status?: DroneStatus;
}
