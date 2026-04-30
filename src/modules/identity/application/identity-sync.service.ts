import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { eq, sql } from 'drizzle-orm';
import { Webhook } from 'svix';
import { users } from '../../../../drizzle/schema';
import { DrizzleService } from 'src/shared/database/drizzle.service';

type ClerkWebhookEvent = {
  type?: string;
  data?: Record<string, unknown>;
};

type ClerkEmailAddress = {
  id?: string;
  email_address?: string;
};

type ClerkUserData = {
  id?: string;
  first_name?: string | null;
  last_name?: string | null;
  primary_email_address_id?: string | null;
  email_addresses?: ClerkEmailAddress[];
  deleted?: boolean;
  public_metadata?: Record<string, unknown>;
  unsafe_metadata?: Record<string, unknown>;
};

type SyncResult =
  | { kind: 'ignored'; reason: string }
  | { kind: 'upserted'; clerkUserId: string; dbUserId: string }
  | { kind: 'softDeleted'; clerkUserId: string };

@Injectable()
export class IdentitySyncService {
  private readonly logger = new Logger(IdentitySyncService.name);

  constructor(private readonly drizzleService: DrizzleService) {}

  async syncFromWebhook(
    payload: Record<string, unknown>,
    headers?: { svixId?: string; svixTimestamp?: string; svixSignature?: string },
    rawBody?: string,
  ): Promise<SyncResult> {
    this.verifySvixSignature(payload, headers, rawBody);

    const event = payload as ClerkWebhookEvent;
    const eventType = event.type;
    if (!eventType) {
      this.logger.warn('Clerk webhook missing "type" field; ignoring');
      return { kind: 'ignored', reason: 'missing_type' };
    }

    switch (eventType) {
      case 'user.created':
      case 'user.updated':
        return this.handleUserUpsert(event.data ?? {});
      case 'user.deleted':
        return this.handleUserDeleted(event.data ?? {});
      default:
        this.logger.log(`Ignoring Clerk event type: ${eventType}`);
        return { kind: 'ignored', reason: `unhandled_type:${eventType}` };
    }
  }

  private verifySvixSignature(
    payload: Record<string, unknown>,
    headers: { svixId?: string; svixTimestamp?: string; svixSignature?: string } | undefined,
    rawBody: string | undefined,
  ): void {
    const secret = process.env.CLERK_WEBHOOK_SECRET;
    const inProduction = process.env.NODE_ENV === 'production';

    if (!secret) {
      if (inProduction) {
        throw new BadRequestException('CLERK_WEBHOOK_SECRET is not configured in production');
      }
      this.logger.warn('CLERK_WEBHOOK_SECRET not set; skipping svix verification (dev only)');
      return;
    }

    if (!headers?.svixId || !headers.svixTimestamp || !headers.svixSignature) {
      throw new BadRequestException('Missing svix-id / svix-timestamp / svix-signature headers');
    }

    const wh = new Webhook(secret);
    const body = rawBody ?? JSON.stringify(payload);
    try {
      wh.verify(body, {
        'svix-id': headers.svixId,
        'svix-timestamp': headers.svixTimestamp,
        'svix-signature': headers.svixSignature,
      });
    } catch (err) {
      throw new BadRequestException(`Invalid svix signature: ${(err as Error).message}`);
    }
  }

  private async handleUserUpsert(data: ClerkUserData): Promise<SyncResult> {
    const clerkUserId = data.id;
    if (!clerkUserId) {
      return { kind: 'ignored', reason: 'missing_clerk_id' };
    }

    const email = pickPrimaryEmail(data) ?? `${clerkUserId}@clerk.local`;
    const fullName = pickFullName(data, email);

    const [row] = await this.drizzleService.db
      .insert(users)
      .values({
        clerkUserId,
        email,
        fullName,
        role: 'CUSTOMER',
      })
      .onConflictDoUpdate({
        target: users.clerkUserId,
        set: {
          email,
          fullName,
          isActive: true,
          updatedAt: sql`now()`,
        },
      })
      .returning({ id: users.id });

    this.logger.log(`Upserted user from Clerk: clerkId=${clerkUserId} dbId=${row.id}`);
    return { kind: 'upserted', clerkUserId, dbUserId: row.id };
  }

  private async handleUserDeleted(data: ClerkUserData): Promise<SyncResult> {
    const clerkUserId = data.id;
    if (!clerkUserId) {
      return { kind: 'ignored', reason: 'missing_clerk_id' };
    }

    await this.drizzleService.db
      .update(users)
      .set({
        isActive: false,
        email: sql`${users.email} || '.deleted-' || extract(epoch from now())::text`,
        updatedAt: sql`now()`,
      })
      .where(eq(users.clerkUserId, clerkUserId));

    this.logger.log(`Soft-deleted user from Clerk: clerkId=${clerkUserId}`);
    return { kind: 'softDeleted', clerkUserId };
  }
}

function pickPrimaryEmail(data: ClerkUserData): string | null {
  const list = Array.isArray(data.email_addresses) ? data.email_addresses : [];
  if (data.primary_email_address_id) {
    const match = list.find((e) => e?.id === data.primary_email_address_id);
    if (match?.email_address) return match.email_address;
  }
  for (const entry of list) {
    if (entry?.email_address) return entry.email_address;
  }
  return null;
}

function pickFullName(data: ClerkUserData, fallback: string): string {
  const first = (data.first_name ?? '').trim();
  const last = (data.last_name ?? '').trim();
  const combined = [first, last].filter(Boolean).join(' ').trim();
  return combined || fallback;
}
