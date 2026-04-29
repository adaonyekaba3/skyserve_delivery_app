import { Module } from '@nestjs/common';
import { DronesController } from './controllers/drones.controller';
import { DronesService } from './application/drones.service';
import { DronesRepository } from './drones.repository';
import { RealtimeModule } from 'src/shared/realtime/realtime.module';

@Module({
  imports: [RealtimeModule],
  controllers: [DronesController],
  providers: [DronesService, DronesRepository],
  exports: [DronesService],
})
export class DronesModule {}
