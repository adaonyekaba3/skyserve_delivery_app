import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { LifecycleStateMachineService } from './lifecycle-state-machine.service';
import { LogisticsWorkflowService } from './logistics-workflow.service';

@Module({
  imports: [PrismaModule],
  providers: [LifecycleStateMachineService, LogisticsWorkflowService],
  exports: [LifecycleStateMachineService, LogisticsWorkflowService],
})
export class WorkflowsModule {}
