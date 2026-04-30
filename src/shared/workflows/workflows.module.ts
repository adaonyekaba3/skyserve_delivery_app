import { Module } from '@nestjs/common';
import { OutboxService } from '../events/outbox.service';
import { LifecycleStateMachineService } from './lifecycle-state-machine.service';
import { LogisticsWorkflowService } from './logistics-workflow.service';

@Module({
  providers: [
    OutboxService,
    LifecycleStateMachineService,
    LogisticsWorkflowService,
  ],
  exports: [LifecycleStateMachineService, LogisticsWorkflowService],
})
export class WorkflowsModule {}
