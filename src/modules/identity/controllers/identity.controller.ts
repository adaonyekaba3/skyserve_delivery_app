import { Body, Controller, Get, Headers, Post, Req } from '@nestjs/common';
import { Public } from '../guards/public.decorator';
import { IdentitySyncService } from '../application/identity-sync.service';

@Controller({ path: 'identity', version: '1' })
export class IdentityController {
  constructor(private readonly identitySyncService: IdentitySyncService) {}

  @Get('me')
  me(@Req() req: { user?: unknown }) {
    return { user: req.user ?? null };
  }

  @Public()
  @Post('webhooks/clerk')
  async syncUser(
    @Body() payload: Record<string, unknown>,
    @Headers('svix-id') svixId?: string,
    @Headers('svix-timestamp') svixTimestamp?: string,
    @Headers('svix-signature') svixSignature?: string,
  ) {
    await this.identitySyncService.syncFromWebhook(payload, {
      svixId,
      svixTimestamp,
      svixSignature,
    });
    return { ok: true };
  }
}
