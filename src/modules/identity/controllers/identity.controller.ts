import { Body, Controller, Get, Headers, Post } from '@nestjs/common';
import { Public } from '../guards/public.decorator';
import { CurrentUser } from '../guards/current-user.decorator';
import { IdentitySyncService } from '../application/identity-sync.service';
import { AuthenticatedUser } from 'src/shared/types/authenticated-user';

@Controller({ path: 'identity', version: '1' })
export class IdentityController {
  constructor(private readonly identitySyncService: IdentitySyncService) {}

  @Get('me')
  me(@CurrentUser() user: AuthenticatedUser) {
    return { user };
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
