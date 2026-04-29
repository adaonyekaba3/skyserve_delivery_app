import { create } from 'zustand';
import type { MenuItem } from '../services/types';

export interface CartLine {
  menuItem: MenuItem;
  quantity: number;
}

interface CartState {
  restaurantId: string | null;
  lines: Record<string, CartLine>;
  add: (menuItem: MenuItem) => void;
  remove: (menuItemId: string) => void;
  setQuantity: (menuItemId: string, quantity: number) => void;
  clear: () => void;
  totalAmount: () => number;
  totalCount: () => number;
}

export const useCart = create<CartState>((set, get) => ({
  restaurantId: null,
  lines: {},
  add: (menuItem) => {
    const state = get();
    if (state.restaurantId && state.restaurantId !== menuItem.restaurantId) {
      set({
        restaurantId: menuItem.restaurantId,
        lines: { [menuItem.id]: { menuItem, quantity: 1 } },
      });
      return;
    }
    const existing = state.lines[menuItem.id];
    set({
      restaurantId: menuItem.restaurantId,
      lines: {
        ...state.lines,
        [menuItem.id]: existing
          ? { ...existing, quantity: existing.quantity + 1 }
          : { menuItem, quantity: 1 },
      },
    });
  },
  remove: (menuItemId) => {
    const { [menuItemId]: _removed, ...rest } = get().lines;
    set({
      lines: rest,
      restaurantId: Object.keys(rest).length ? get().restaurantId : null,
    });
  },
  setQuantity: (menuItemId, quantity) => {
    const lines = { ...get().lines };
    if (quantity <= 0) {
      delete lines[menuItemId];
    } else if (lines[menuItemId]) {
      lines[menuItemId] = { ...lines[menuItemId], quantity };
    }
    set({
      lines,
      restaurantId: Object.keys(lines).length ? get().restaurantId : null,
    });
  },
  clear: () => set({ restaurantId: null, lines: {} }),
  totalAmount: () =>
    Object.values(get().lines).reduce(
      (sum, line) => sum + Number(line.menuItem.price) * line.quantity,
      0,
    ),
  totalCount: () =>
    Object.values(get().lines).reduce((sum, line) => sum + line.quantity, 0),
}));
