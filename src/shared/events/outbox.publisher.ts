import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { eq, sql } from 'drizzle-orm';
import { DrizzleService } from '../database/drizzle.service';
import { PusherService } from '../realtime/pusher.service';
import { outboxEvents } from '../../../drizzle/schema';

const POLL_INTERVAL_MS = 5_000;
const BATCH_SIZE = 50;

/**
 * Periodically drains unpublished outbox rows and forwards them to Pusher.
 * Best-effort delivery: a failed Pusher trigger keeps the row unpublished.
 */
@Injectable()
export class OutboxPublisher implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(OutboxPublisher.name);
  private timer: NodeJS.Timeout | null = null;
  private running = false;

  constructor(
    private readonly drizzleService: DrizzleService,
    private readonly pusherService: PusherService,
  ) {}

  onModuleInit() {
    if (process.env.OUTBOX_DISABLED === '1') {
      this.logger.warn('Outbox publisher disabled (OUTBOX_DISABLED=1)');
      return;
    }
    this.timer = setInterval(() => {
      void this.tick();
    }, POLL_INTERVAL_MS);
    this.logger.log(`Outbox publisher started (interval ${POLL_INTERVAL_MS}ms)`);
  }

  onModuleDestroy() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  private async tick() {
    if (this.running) return;
    this.running = true;
    try {
      const rows = await this.drizzleService.db
        .select()
        .from(outboxEvents)
        .where(eq(outboxEvents.published, false))
        .limit(BATCH_SIZE);

      for (const row of rows) {
        try {
          await this.publishOne(row.eventType, row.payload);
          await this.drizzleService.db
            .update(outboxEvents)
            .set({ published: true })
            .where(eq(outboxEvents.id, row.id));
        } catch (err) {
          this.logger.warn(
            `Failed to publish outbox event ${row.id} (${row.eventType}): ${(err as Error).message}`,
          );
        }
      }
    } catch (err) {
      this.logger.error(`Outbox tick failed: ${(err as Error).message}`);
    } finally {
      this.running = false;
    }
  }

  private async publishOne(
    eventType: string,
    payload: Record<string, unknown>,
  ) {
    const channel = this.channelFor(eventType, payload);
    if (!channel) {
      this.logger.debug(`No channel mapping for outbox event ${eventType}`);
      return;
    }
    await this.pusherService.trigger(channel, eventType, payload);
  }

  private channelFor(
    eventType: string,
    payload: Record<string, unknown>,
  ): string | null {
    if (eventType.startsWith('package.')) {
      const senderId = payload.senderId as string | undefined;
      return senderId ? `private-customer-${senderId}` : 'private-admin';
    }
    if (eventType.startsWith('payment.')) {
      const userId = payload.userId as string | undefined;
      return userId ? `private-customer-${userId}` : 'private-admin';
    }
    if (eventType.startsWith('bank_transfer.')) {
      return 'private-admin';
    }
    if (eventType.startsWith('order.')) {
      const customerId = payload.customerId as string | undefined;
      return customerId ? `private-customer-${customerId}` : 'orders';
    }
    return null;
  }
}
