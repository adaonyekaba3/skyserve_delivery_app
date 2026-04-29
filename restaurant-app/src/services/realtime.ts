import Pusher, { Channel } from 'pusher-js';
import { apiBaseUrl } from './api';

const KEY = process.env.EXPO_PUBLIC_PUSHER_KEY ?? '';
const CLUSTER = process.env.EXPO_PUBLIC_PUSHER_CLUSTER ?? 'mt1';

let pusher: Pusher | null = null;
let tokenGetter: () => Promise<string | null> = async () => null;

export function configureRealtime(getToken: () => Promise<string | null>) {
  tokenGetter = getToken;
}

export function getPusher(): Pusher | null {
  if (!KEY) return null;
  if (pusher) return pusher;
  pusher = new Pusher(KEY, {
    cluster: CLUSTER,
    authorizer: (channel) => ({
      authorize: async (socketId, callback) => {
        try {
          const token = await tokenGetter();
          const res = await fetch(`${apiBaseUrl}/realtime/auth`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            body: JSON.stringify({ socket_id: socketId, channel_name: channel.name }),
          });
          if (!res.ok) throw new Error(`auth failed: ${res.status}`);
          callback(null, await res.json());
        } catch (err) {
          callback(err as Error, null);
        }
      },
    }),
  });
  return pusher;
}

export function subscribe(channelName: string): Channel | null {
  return getPusher()?.subscribe(channelName) ?? null;
}

export function unsubscribe(channelName: string): void {
  pusher?.unsubscribe(channelName);
}

export function disconnectRealtime() {
  pusher?.disconnect();
  pusher = null;
}
