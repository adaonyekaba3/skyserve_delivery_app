import { Module } from '@nestjs/common';
import { DeliveriesController } from './controllers/deliveries.controller';
import { DeliveriesService } from './application/deliveries.service';
import { WorkflowsModule } from 'src/shared/workflows/workflows.module';

@Module({
  imports: [WorkflowsModule],
  controllers: [DeliveriesController],
  providers: [DeliveriesService],
})
export class DeliveriesModule {}
