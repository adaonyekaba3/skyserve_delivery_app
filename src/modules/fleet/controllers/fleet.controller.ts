import { Controller, Get } from '@nestjs/common';

@Controller({ path: 'fleet', version: '1' })
export class FleetController {
  @Get('status')
  status() {
    return { dronesOnline: 0, dronesAssigned: 0, updatedAt: new Date().toISOString() };
  }
}
