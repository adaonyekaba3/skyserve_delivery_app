import { Module } from '@nestjs/common';
import { OrdersController } from './controllers/orders.controller';
import { OrdersService } from './application/orders.service';
import { OrdersRepository } from './orders.repository';
import { WorkflowsModule } from 'src/shared/workflows/workflows.module';

@Module({
  imports: [WorkflowsModule],
  controllers: [OrdersController],
  providers: [OrdersService, OrdersRepository],
  exports: [OrdersService],
})
export class OrdersModule {}
