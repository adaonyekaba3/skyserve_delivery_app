import { Controller, Get } from '@nestjs/common';
import { Roles } from 'src/modules/identity/guards/roles.decorator';
import { Role } from 'src/shared/types/role.enum';

@Controller({ path: 'operator', version: '1' })
export class OperatorController {
  @Roles(Role.ADMIN, Role.OPERATIONS, Role.SUPPORT)
  @Get('dashboard')
  dashboard() {
    return {
      queues: { pendingOrders: 0, activeDeliveries: 0 },
      fleet: { available: 0, inFlight: 0 },
      finance: { todaysVolume: '0.00', currency: 'NGN' },
    };
  }
}
