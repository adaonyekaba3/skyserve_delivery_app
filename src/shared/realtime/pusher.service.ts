import { Injectable, Logger } from '@nestjs/common';
import Pusher from 'pusher';

/**
 * Thin wrapper around the Pusher Channels server SDK.
 *
 * Triggers no-op silently when env keys are not configured so local dev
 * (without Pusher credentials) does not crash.
 */
@Injectable()
export class PusherService {
  private readonly logger = new Logger(PusherService.name);
  private client: Pusher | null = null;

  constructor() {
    const appId = process.env.PUSHER_APP_ID;
    const key = process.env.PUSHER_KEY;
    const secret = process.env.PUSHER_SECRET;
    const cluster = process.env.PUSHER_CLUSTER;

    if (appId && key && secret && cluster) {
      this.client = new Pusher({
        appId,
        key,
        secret,
        cluster,
        useTLS: true,
      });
    } else {
      this.logger.warn(
        'Pusher env vars missing (PUSHER_APP_ID/KEY/SECRET/CLUSTER); realtime publishes are no-ops',
      );
    }
  }

  isConfigured(): boolean {
    return this.client !== null;
  }

  async trigger(channel: string, event: string, payload: unknown): Promise<void> {
    if (!this.client) {
      this.logger.debug(`Pusher trigger skipped: ${channel}:${event}`);
      return;
    }
    try {
      await this.client.trigger(channel, event, payload);
    } catch (err) {
      this.logger.error(`Pusher trigger failed for ${channel}:${event}`, (err as Error).message);
    }
  }

  authorizeChannel(socketId: string, channel: string, presenceData?: Record<string, unknown>): {
    auth: string;
    channel_data?: string;
  } {
    if (!this.client) {
      throw new Error('Pusher is not configured on the server');
    }
    if (presenceData) {
      return this.client.authorizeChannel(socketId, channel, {
        user_id: String(presenceData.userId ?? socketId),
        user_info: presenceData,
      });
    }
    return this.client.authorizeChannel(socketId, channel);
  }
}
