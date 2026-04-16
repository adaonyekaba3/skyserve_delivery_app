import { Module } from '@nestjs/common';
import { DispatchController } from './controllers/dispatch.controller';
import { DispatchService } from './application/dispatch.service';
import { WorkflowsModule } from 'src/shared/workflows/workflows.module';

@Module({
  imports: [WorkflowsModule],
  controllers: [DispatchController],
  providers: [DispatchService],
  exports: [DispatchService],
})
export class DispatchModule {}
