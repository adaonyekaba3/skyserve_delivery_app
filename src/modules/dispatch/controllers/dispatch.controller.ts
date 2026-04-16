import { Controller, Param, Post } from '@nestjs/common';
import { DispatchService } from '../application/dispatch.service';

@Controller({ path: 'dispatch', version: '1' })
export class DispatchController {
  constructor(private readonly dispatchService: DispatchService) {}

  @Post('orders/:status/validate')
  validate(@Param('status') status: 'PENDING' | 'ACCEPTED' | 'PREPARING' | 'PICKED_UP' | 'IN_FLIGHT' | 'DELIVERED' | 'CANCELLED') {
    return this.dispatchService.validateDispatchableOrder(status);
  }
}
