import { create } from 'zustand';
import type { Order } from '../services/types';

interface FeedState {
  byId: Record<string, Order>;
  upsert: (order: Order) => void;
  setMany: (orders: Order[]) => void;
}

export const useFeed = create<FeedState>((set) => ({
  byId: {},
  upsert: (order) =>
    set((state) => ({
      byId: {
        ...state.byId,
        [order.id]: { ...state.byId[order.id], ...order },
      },
    })),
  setMany: (orders) =>
    set(() => {
      const byId: Record<string, Order> = {};
      for (const o of orders) byId[o.id] = o;
      return { byId };
    }),
}));
