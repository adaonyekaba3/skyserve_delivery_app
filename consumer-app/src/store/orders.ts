import { create } from 'zustand';
import type { Order } from '../services/types';

interface OrdersState {
  byId: Record<string, Order>;
  upsert: (order: Order) => void;
  setMany: (orders: Order[]) => void;
  clear: () => void;
}

export const useOrders = create<OrdersState>((set) => ({
  byId: {},
  upsert: (order) =>
    set((state) => ({ byId: { ...state.byId, [order.id]: { ...state.byId[order.id], ...order } } })),
  setMany: (orders) =>
    set(() => {
      const byId: Record<string, Order> = {};
      for (const order of orders) {
        byId[order.id] = order;
      }
      return { byId };
    }),
  clear: () => set({ byId: {} }),
}));
