import { Body, Controller, Get, Param, Patch } from '@nestjs/common';
import { IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { DronesService } from '../application/drones.service';
import { Roles } from 'src/modules/identity/guards/roles.decorator';
import { Role } from 'src/shared/types/role.enum';

class TelemetryDto {
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  batteryPct?: number;

  @IsOptional()
  @IsString()
  latitude?: string;

  @IsOptional()
  @IsString()
  longitude?: string;

  @IsOptional()
  @IsIn(['IDLE', 'DELIVERING', 'CHARGING', 'MAINTENANCE'])
  status?: 'IDLE' | 'DELIVERING' | 'CHARGING' | 'MAINTENANCE';

  @IsOptional()
  @IsString()
  activeDeliveryId?: string | null;
}

@Controller({ path: 'drones', version: '1' })
export class DronesController {
  constructor(private readonly dronesService: DronesService) {}

  @Roles(Role.ADMIN, Role.OPERATIONS)
  @Get()
  list() {
    return this.dronesService.list();
  }

  @Roles(Role.ADMIN, Role.OPERATIONS)
  @Patch(':code/telemetry')
  updateTelemetry(@Param('code') code: string, @Body() body: TelemetryDto) {
    return this.dronesService.updateTelemetry(code, body);
  }
}
