import { Injectable, Logger } from '@nestjs/common';
import { Webhook } from 'svix';

@Injectable()
export class IdentitySyncService {
  private readonly logger = new Logger(IdentitySyncService.name);

  async syncFromWebhook(
    payload: Record<string, unknown>,
    headers?: { svixId?: string; svixTimestamp?: string; svixSignature?: string },
  ) {
    const secret = process.env.CLERK_WEBHOOK_SECRET;
    if (secret && headers?.svixId && headers.svixTimestamp && headers.svixSignature) {
      const webhook = new Webhook(secret);
      webhook.verify(JSON.stringify(payload), {
        'svix-id': headers.svixId,
        'svix-timestamp': headers.svixTimestamp,
        'svix-signature': headers.svixSignature,
      });
    }

    this.logger.log('Received Clerk user sync webhook');
    this.logger.verbose(JSON.stringify(payload));
  }
}
