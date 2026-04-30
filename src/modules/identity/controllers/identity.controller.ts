import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Headers,
  Patch,
  Post,
  Req,
} from '@nestjs/common';
import type { RawBodyRequest } from '@nestjs/common';
import type { Request } from 'express';
import { eq } from 'drizzle-orm';
import { IsOptional, IsString, MaxLength } from 'class-validator';
import { Public } from '../guards/public.decorator';
import { CurrentUser } from '../guards/current-user.decorator';
import { IdentitySyncService } from '../application/identity-sync.service';
import { AuthenticatedUser } from 'src/shared/types/authenticated-user';
import { DrizzleService } from 'src/shared/database/drizzle.service';
import { users } from '../../../../drizzle/schema';
import { normalizeNgPhone } from 'src/shared/utils/phone.util';

class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  fullName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  phoneNumber?: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  defaultAddress?: string;

  @IsOptional()
  @IsString()
  defaultLatitude?: string;

  @IsOptional()
  @IsString()
  defaultLongitude?: string;
}

@Controller({ path: 'identity', version: '1' })
export class IdentityController {
  constructor(
    private readonly identitySyncService: IdentitySyncService,
    private readonly drizzleService: DrizzleService,
  ) {}

  @Get('me')
  async me(@CurrentUser() user: AuthenticatedUser) {
    const [row] = await this.drizzleService.db
      .select()
      .from(users)
      .where(eq(users.id, user.dbUserId))
      .limit(1);
    return { user, profile: row ?? null };
  }

  @Patch('me')
  async updateMe(
    @Body() dto: UpdateProfileDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const update: Record<string, string | Date> = { updatedAt: new Date() };
    if (dto.fullName) update.fullName = dto.fullName.trim();
    if (dto.phoneNumber) {
      const phone = normalizeNgPhone(dto.phoneNumber);
      if (!phone) {
        throw new BadRequestException('Invalid Nigerian phone number');
      }
      update.phoneNumber = phone;
    }
    if (dto.defaultAddress != null) {
      update.defaultAddress = dto.defaultAddress.trim();
    }
    if (dto.defaultLatitude) update.defaultLatitude = dto.defaultLatitude;
    if (dto.defaultLongitude) update.defaultLongitude = dto.defaultLongitude;

    const [updated] = await this.drizzleService.db
      .update(users)
      .set(update)
      .where(eq(users.id, user.dbUserId))
      .returning();
    return { profile: updated };
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
      throw new BadRequestException(
        'Clerk webhooks require svix headers in production',
      );
    }

    if (hasSecret && !rawBody) {
      throw new BadRequestException(
        'Raw request body is required to verify svix signature',
      );
    }

    const result = await this.identitySyncService.syncFromWebhook(
      payload,
      { svixId, svixTimestamp, svixSignature },
      rawBody,
    );
    return { ok: true, result };
  }
}
