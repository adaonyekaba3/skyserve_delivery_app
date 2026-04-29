import { Injectable, NotFoundException } from '@nestjs/common';
import { DronesRepository } from '../drones.repository';
import { PusherService } from 'src/shared/realtime/pusher.service';

export interface TelemetryInput {
  batteryPct?: number;
  latitude?: string;
  longitude?: string;
  status?: 'IDLE' | 'DELIVERING' | 'CHARGING' | 'MAINTENANCE';
  activeDeliveryId?: string | null;
}

@Injectable()
export class DronesService {
  constructor(
    private readonly dronesRepository: DronesRepository,
    private readonly pusherService: PusherService,
  ) {}

  list() {
    return this.dronesRepository.list();
  }

  async updateTelemetry(code: string, input: TelemetryInput) {
    const [updated] = await this.dronesRepository.updateTelemetry(code, {
      batteryPct: input.batteryPct,
      currentLatitude: input.latitude,
      currentLongitude: input.longitude,
      status: input.status,
      activeDeliveryId: input.activeDeliveryId,
    });

    if (!updated) {
      throw new NotFoundException(`Drone ${code} not found`);
    }

    await this.pusherService.trigger('drones', 'drone_location_updated', updated);
    return updated;
  }
}
