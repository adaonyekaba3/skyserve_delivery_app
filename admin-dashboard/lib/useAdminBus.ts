'use client';

import { useEffect, useRef, useState } from 'react';
import type { Channel } from 'pusher-js';
import { subscribe, unsubscribe } from './realtime';
import type { Order, Drone, Vendor } from './types';

export interface OrderChangeEvent {
  type: 'created' | 'status_updated';
  order: Order;
}

export interface DroneChangeEvent {
  type: 'telemetry';
  drone: Drone;
}

export interface VendorChangeEvent {
  type: 'created' | 'updated' | 'active_changed';
  restaurant: Vendor;
}

export interface CartChangeEvent {
  userId: string;
  itemCount: number;
  restaurantId?: string | null;
}

interface AdminBusListeners {
  onOrderChanged?: (event: OrderChangeEvent) => void;
  onDroneChanged?: (event: DroneChangeEvent) => void;
  onVendorChanged?: (event: VendorChangeEvent) => void;
  onCartChanged?: (event: CartChangeEvent) => void;
}

export interface AdminBusState {
  lastEventAt: Date | null;
  liveOrderCount: number;
}

export function useAdminBus(listeners: AdminBusListeners = {}): AdminBusState {
  const [state, setState] = useState<AdminBusState>({
    lastEventAt: null,
    liveOrderCount: 0,
  });
  const listenersRef = useRef(listeners);
  listenersRef.current = listeners;

  useEffect(() => {
    const channel: Channel | null = subscribe('private-admin');
    if (!channel) return;

    const orderHandler = (payload: OrderChangeEvent) => {
      setState((s) => ({
        lastEventAt: new Date(),
        liveOrderCount: s.liveOrderCount + (payload.type === 'created' ? 1 : 0),
      }));
      listenersRef.current.onOrderChanged?.(payload);
    };
    const droneHandler = (payload: DroneChangeEvent) => {
      setState((s) => ({ ...s, lastEventAt: new Date() }));
      listenersRef.current.onDroneChanged?.(payload);
    };
    const vendorHandler = (payload: VendorChangeEvent) => {
      setState((s) => ({ ...s, lastEventAt: new Date() }));
      listenersRef.current.onVendorChanged?.(payload);
    };
    const cartHandler = (payload: CartChangeEvent) => {
      setState((s) => ({ ...s, lastEventAt: new Date() }));
      listenersRef.current.onCartChanged?.(payload);
    };

    channel.bind('order_changed', orderHandler);
    channel.bind('drone_changed', droneHandler);
    channel.bind('vendor_updated', vendorHandler);
    channel.bind('cart_updated', cartHandler);

    return () => {
      channel.unbind('order_changed', orderHandler);
      channel.unbind('drone_changed', droneHandler);
      channel.unbind('vendor_updated', vendorHandler);
      channel.unbind('cart_updated', cartHandler);
      unsubscribe('private-admin');
    };
  }, []);

  return state;
}
