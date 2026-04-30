import { Injectable, Logger } from '@nestjs/common';
import { DrizzleService } from '../database/drizzle.service';
import { outboxEvents } from '../../../drizzle/schema';

@Injectable()
export class OutboxService {
  private readonly logger = new Logger(OutboxService.name);

  constructor(private readonly drizzleService: DrizzleService) {}

  async enqueue(eventType: string, payload: Record<string, unknown>) {
    try {
      await this.drizzleService.db.insert(outboxEvents).values({
        eventType,
        payload,
      });
      this.logger.debug(`Outbox event persisted: ${eventType}`);
    } catch (err) {
      this.logger.error(
        `Outbox enqueue failed for ${eventType}: ${(err as Error).message}`,
      );
    }
  }
}
