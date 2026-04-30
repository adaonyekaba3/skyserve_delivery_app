import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Headers,
  Post,
  Req,
} from '@nestjs/common';
import type { RawBodyRequest } from '@nestjs/common';
import type { Request } from 'express';
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
    @Req() req: RawBodyRequest<Request>,
    @Body() payload: Record<string, unknown>,
    @Headers('svix-id') svixId?: string,
    @Headers('svix-timestamp') svixTimestamp?: string,
    @Headers('svix-signature') svixSignature?: string,
  ) {
    const rawBody = req.rawBody?.toString('utf8');
    const inProduction = process.env.NODE_ENV === 'production';
    const hasSecret = Boolean(process.env.CLERK_WEBHOOK_SECRET);

    if (inProduction && (!svixId || !svixTimestamp || !svixSignature)) {
      throw new BadRequestException('Clerk webhooks require svix headers in production');
    }

    if (hasSecret && !rawBody) {
      throw new BadRequestException('Raw request body is required to verify svix signature');
    }

    const result = await this.identitySyncService.syncFromWebhook(
      payload,
      { svixId, svixTimestamp, svixSignature },
      rawBody,
    );
    return { ok: true, result };
  }
}
