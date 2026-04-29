import { useEffect } from 'react';
import { subscribe, unsubscribe } from '../services/realtime';
import { useOrders } from '../store/orders';
import type { Order } from '../services/types';
import { notifyOrderUpdate } from '../services/notifications';

export function useOrderUpdates(userDbId: string | null) {
  const upsert = useOrders((s) => s.upsert);

  useEffect(() => {
    if (!userDbId) return undefined;
    const channelName = `private-customer-${userDbId}`;
    const channel = subscribe(channelName);
    if (!channel) return undefined;

    const handler = (payload: Order) => {
      upsert(payload);
      void notifyOrderUpdate('Order update', `Order #${payload.id.slice(0, 8)} is now ${payload.status}`);
    };
    channel.bind('order_status_updated', handler);
    channel.bind('order_created', handler);
    return () => {
      channel.unbind('order_status_updated', handler);
      channel.unbind('order_created', handler);
      unsubscribe(channelName);
    };
  }, [userDbId, upsert]);
}

export function useDroneTelemetry(onUpdate: (payload: { code: string; currentLatitude?: string | null; currentLongitude?: string | null }) => void) {
  useEffect(() => {
    const channel = subscribe('drones');
    if (!channel) return undefined;
    const handler = (payload: { code: string; currentLatitude?: string | null; currentLongitude?: string | null }) => {
      onUpdate(payload);
    };
    channel.bind('drone_location_updated', handler);
    return () => {
      channel.unbind('drone_location_updated', handler);
      unsubscribe('drones');
    };
  }, [onUpdate]);
}
