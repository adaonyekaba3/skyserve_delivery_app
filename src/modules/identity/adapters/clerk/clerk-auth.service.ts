import { Injectable, UnauthorizedException } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { verifyToken } from '@clerk/backend';
import { restaurants, users } from '../../../../../drizzle/schema';
import { DrizzleService } from 'src/shared/database/drizzle.service';
import { AuthenticatedUser } from 'src/shared/types/authenticated-user';
import { Role } from 'src/shared/types/role.enum';

const DEV_BEARER = 'dev-token';

@Injectable()
export class ClerkAuthService {
  constructor(private readonly drizzleService: DrizzleService) {}

  async verifyBearerToken(token: string): Promise<AuthenticatedUser> {
    if (!token) {
      throw new UnauthorizedException('Missing bearer token');
    }

    if (this.isDevToken(token)) {
      return this.devUser();
    }

    const claims = await this.verifyClerkJwt(token);
    const clerkUserId = claims.sub;

    if (!clerkUserId) {
      throw new UnauthorizedException('Invalid Clerk token: no subject');
    }

    const dbUser = await this.findOrProvisionDbUser(clerkUserId, claims);
    const ownedRestaurants = await this.drizzleService.db
      .select({ id: restaurants.id })
      .from(restaurants)
      .where(eq(restaurants.ownerId, dbUser.id));

    return {
      sub: clerkUserId,
      dbUserId: dbUser.id,
      email: dbUser.email,
      role: dbUser.role as Role,
      restaurantIds: ownedRestaurants.map((r) => r.id),
    };
  }

  private isDevToken(token: string): boolean {
    if (
      process.env.ALLOW_DEV_TOKEN !== 'true' &&
      process.env.NODE_ENV === 'production'
    ) {
      return false;
    }
    return token === DEV_BEARER;
  }

  private async devUser(): Promise<AuthenticatedUser> {
    const rows = await this.drizzleService.db
      .select()
      .from(users)
      .where(eq(users.email, 'dev@skyrunner.local'))
      .limit(1);

    if (rows[0]) {
      const ownedRestaurants = await this.drizzleService.db
        .select({ id: restaurants.id })
        .from(restaurants)
        .where(eq(restaurants.ownerId, rows[0].id));
      return {
        sub: rows[0].clerkUserId,
        dbUserId: rows[0].id,
        email: rows[0].email,
        role: rows[0].role as Role,
        restaurantIds: ownedRestaurants.map((r) => r.id),
      };
    }

    return {
      sub: 'dev-user',
      dbUserId: '00000000-0000-0000-0000-000000000000',
      email: 'dev@skyrunner.local',
      role: Role.ADMIN,
      restaurantIds: [],
    };
  }

  private async verifyClerkJwt(
    token: string,
  ): Promise<{ sub?: string; email?: string }> {
    const secretKey = process.env.CLERK_SECRET_KEY;
    if (!secretKey) {
      throw new UnauthorizedException('CLERK_SECRET_KEY is not configured');
    }
    try {
      const claims = (await verifyToken(token, { secretKey })) as Record<
        string,
        unknown
      >;
      return {
        sub: typeof claims.sub === 'string' ? claims.sub : undefined,
        email:
          typeof claims.email === 'string'
            ? claims.email
            : typeof (claims.email_address ?? claims.primary_email_address) ===
                'string'
              ? ((claims.email_address ??
                  claims.primary_email_address) as string)
              : undefined,
      };
    } catch (err) {
      throw new UnauthorizedException(
        `Invalid Clerk token: ${(err as Error).message}`,
      );
    }
  }

  private async findOrProvisionDbUser(
    clerkUserId: string,
    claims: { email?: string },
  ) {
    const existing = await this.drizzleService.db
      .select()
      .from(users)
      .where(eq(users.clerkUserId, clerkUserId))
      .limit(1);

    if (existing[0]) {
      return existing[0];
    }

    const [created] = await this.drizzleService.db
      .insert(users)
      .values({
        clerkUserId,
        email: claims.email ?? `${clerkUserId}@clerk.local`,
        fullName: claims.email ?? clerkUserId,
        role: 'CUSTOMER',
      })
      .returning();
    return created;
  }
}
