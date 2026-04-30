import { Module } from '@nestjs/common';
import { LifecycleStateMachineService } from './lifecycle-state-machine.service';
import { LogisticsWorkflowService } from './logistics-workflow.service';

@Module({
  providers: [LifecycleStateMachineService, LogisticsWorkflowService],
  exports: [LifecycleStateMachineService, LogisticsWorkflowService],
})
export class WorkflowsModule {}
