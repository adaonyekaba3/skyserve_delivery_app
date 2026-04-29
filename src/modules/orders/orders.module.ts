import { Module } from '@nestjs/common';
import { OrdersController } from './controllers/orders.controller';
import { OrdersService } from './application/orders.service';
import { OrdersRepository } from './orders.repository';
import { WorkflowsModule } from 'src/shared/workflows/workflows.module';
import { RealtimeModule } from 'src/shared/realtime/realtime.module';

@Module({
  imports: [WorkflowsModule, RealtimeModule],
  controllers: [OrdersController],
  providers: [OrdersService, OrdersRepository],
  exports: [OrdersService],
})
export class OrdersModule {}
