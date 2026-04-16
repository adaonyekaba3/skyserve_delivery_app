import { Injectable } from '@nestjs/common';
import { Role } from 'src/shared/types/role.enum';
import { AuthenticatedUser } from 'src/shared/types/authenticated-user';

@Injectable()
export class ClerkAuthService {
  async verifyBearerToken(token: string): Promise<AuthenticatedUser> {
    if (!token) {
      throw new Error('Missing bearer token');
    }

    // Placeholder: replace with Clerk SDK JWT verification.
    return {
      sub: 'dev-user',
      email: 'dev@skyrunner.local',
      role: Role.ADMIN,
    };
  }
}
