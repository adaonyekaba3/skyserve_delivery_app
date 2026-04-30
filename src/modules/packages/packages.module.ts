import { Module } from '@nestjs/common';
import { PackagesController } from './controllers/packages.controller';
import { PackagesService } from './application/packages.service';
import { PackagesRepository } from './packages.repository';
import { RealtimeModule } from 'src/shared/realtime/realtime.module';

@Module({
  imports: [RealtimeModule],
  controllers: [PackagesController],
  providers: [PackagesService, PackagesRepository],
  exports: [PackagesService],
})
export class PackagesModule {}
