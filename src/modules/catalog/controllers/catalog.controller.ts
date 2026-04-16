import { Controller, Get } from '@nestjs/common';

@Controller({ path: 'catalog', version: '1' })
export class CatalogController {
  @Get('health')
  health() {
    return { ok: true };
  }
}
