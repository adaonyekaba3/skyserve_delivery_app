import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { IdentityController } from './controllers/identity.controller';
import { ClerkJwtGuard } from './guards/clerk-jwt.guard';
import { RolesGuard } from './guards/roles.guard';
import { ClerkAuthService } from './adapters/clerk/clerk-auth.service';
import { IdentitySyncService } from './application/identity-sync.service';

@Module({
  controllers: [IdentityController],
  providers: [
    ClerkAuthService,
    IdentitySyncService,
    { provide: APP_GUARD, useClass: ClerkJwtGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
  exports: [ClerkAuthService, IdentitySyncService],
})
export class IdentityModule {}
