import { useEffect, useMemo } from 'react';
import { useOrders } from '../store/orders';
import { getMyOrders } from '../services/api';

export function useRecentRestaurants(limit = 5): string[] {
  const orders = useOrders((s) => Object.values(s.byId));
  const setMany = useOrders((s) => s.setMany);

  useEffect(() => {
    if (orders.length === 0) {
      getMyOrders()
        .then(setMany)
        .catch(() => {});
    }
  }, [orders.length, setMany]);

  return useMemo(() => {
    const seen = new Set<string>();
    const ordered: string[] = [];
    const sorted = [...orders].sort((a, b) =>
      a.createdAt < b.createdAt ? 1 : -1,
    );
    for (const o of sorted) {
      if (!seen.has(o.restaurantId)) {
        seen.add(o.restaurantId);
        ordered.push(o.restaurantId);
      }
      if (ordered.length >= limit) break;
    }
    return ordered;
  }, [orders, limit]);
}
