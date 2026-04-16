import { Controller, Get } from '@nestjs/common';

@Controller({ path: 'restaurants', version: '1' })
export class RestaurantsController {
  @Get()
  list() {
    return [];
  }
}
