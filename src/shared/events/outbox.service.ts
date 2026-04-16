import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class OutboxService {
  private readonly logger = new Logger(OutboxService.name);

  async enqueue(eventType: string, payload: Record<string, unknown>) {
    this.logger.debug(`Outbox event queued: ${eventType}`);
    this.logger.verbose(JSON.stringify(payload));
  }
}
