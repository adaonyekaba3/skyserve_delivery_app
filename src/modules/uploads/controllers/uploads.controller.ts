import {
  BadRequestException,
  Body,
  Controller,
  Post,
} from '@nestjs/common';
import { IsString, MaxLength, MinLength } from 'class-validator';
import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import { Roles } from 'src/modules/identity/guards/roles.decorator';
import { Role } from 'src/shared/types/role.enum';
import { CurrentUser } from 'src/modules/identity/guards/current-user.decorator';
import { AuthenticatedUser } from 'src/shared/types/authenticated-user';
import { randomBytes } from 'crypto';

class UploadProofDto {
  // Base64 data URL or raw base64 (max ~5MB encoded ~6.7MB)
  @IsString()
  @MinLength(20)
  @MaxLength(8_000_000)
  fileBase64!: string;

  @IsString()
  @MaxLength(20)
  extension!: string;
}

@Controller({ path: 'payments/uploads', version: '1' })
export class UploadsController {
  @Roles(Role.ADMIN, Role.CUSTOMER)
  @Post('proof')
  uploadProof(
    @Body() dto: UploadProofDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const ext = (dto.extension || 'png').replace(/[^a-z0-9]/gi, '').toLowerCase();
    if (!['png', 'jpg', 'jpeg', 'webp', 'pdf'].includes(ext)) {
      throw new BadRequestException('Unsupported extension');
    }
    const cleaned = dto.fileBase64.replace(/^data:[^;]+;base64,/, '');
    let buffer: Buffer;
    try {
      buffer = Buffer.from(cleaned, 'base64');
    } catch {
      throw new BadRequestException('Invalid base64 payload');
    }
    if (buffer.byteLength === 0 || buffer.byteLength > 5_000_000) {
      throw new BadRequestException('Proof must be 0 < size <= 5MB');
    }

    const dir = process.env.UPLOADS_DIR || './uploads';
    const subdir = join(dir, 'bank-proofs');
    try {
      mkdirSync(subdir, { recursive: true });
    } catch {
      // Directory may already exist; ignore.
    }

    const filename = `${user.dbUserId}_${Date.now()}_${randomBytes(4).toString('hex')}.${ext}`;
    const fullPath = join(subdir, filename);
    writeFileSync(fullPath, buffer);

    const publicBase = process.env.APP_PUBLIC_URL || '';
    const url = `${publicBase}/uploads/bank-proofs/${filename}`;
    return { url, filename };
  }
}
