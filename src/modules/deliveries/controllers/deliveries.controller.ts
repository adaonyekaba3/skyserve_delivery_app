import { Controller, Get, Param, Patch, Query } from '@nestjs/common';
import { DeliveriesService } from '../application/deliveries.service';

@Controller({ path: 'deliveries', version: '1' })
export class DeliveriesController {
  constructor(private readonly deliveriesService: DeliveriesService) {}

  @Get()
  list() {
    return this.deliveriesService.listRecent();
  }

  @Patch(':id/status/:status')
  updateStatus(
    @Param('id') id: string,
    @Param('status')
    status:
      | 'ASSIGNED'
      | 'PICKED_UP'
      | 'IN_FLIGHT'
      | 'DELIVERED'
      | 'FAILED'
      | 'CANCELLED',
    @Query('latitude') latitude?: string,
    @Query('longitude') longitude?: string,
    @Query('etaMinutes') etaMinutes?: string,
  ) {
    const location =
      latitude && longitude
        ? {
            latitude,
            longitude,
            etaMinutes: etaMinutes ? Number(etaMinutes) : undefined,
          }
        : undefined;
    return this.deliveriesService.updateStatus(id, status, location);
  }
}
