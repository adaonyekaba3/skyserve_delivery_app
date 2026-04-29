import { Global, Module } from '@nestjs/common';
import { PusherService } from './pusher.service';
import { RealtimeController } from './realtime.controller';

@Global()
@Module({
  controllers: [RealtimeController],
  providers: [PusherService],
  exports: [PusherService],
})
export class RealtimeModule {}
