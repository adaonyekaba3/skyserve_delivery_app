import { Module } from '@nestjs/common';
import { FleetController } from './controllers/fleet.controller';

@Module({
  controllers: [FleetController],
})
export class FleetModule {}
