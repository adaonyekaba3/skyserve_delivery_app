import { Controller, Get } from '@nestjs/common';

@Controller({ path: 'users', version: '1' })
export class UsersController {
  @Get('health')
  health() {
    return { ok: true };
  }
}
