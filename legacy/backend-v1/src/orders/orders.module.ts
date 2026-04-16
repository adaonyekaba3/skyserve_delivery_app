import { Module } from '@nestjs/common';
import { WorkflowsModule } from 'src/workflows/workflows.module';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';

@Module({
  imports: [WorkflowsModule],
  controllers: [OrdersController],
  providers: [OrdersService],
  exports: [OrdersService],
})
export class OrdersModule {}
