import { Injectable } from '@nestjs/common';
import { LifecycleStateMachineService } from 'src/shared/workflows/lifecycle-state-machine.service';

@Injectable()
export class DispatchService {
  constructor(private readonly lifecycleStateMachine: LifecycleStateMachineService) {}

  validateDispatchableOrder(status: Parameters<LifecycleStateMachineService['assertValidOrderTransition']>[0]) {
    this.lifecycleStateMachine.assertValidOrderTransition(status, 'ACCEPTED');
    return { ok: true };
  }
}
