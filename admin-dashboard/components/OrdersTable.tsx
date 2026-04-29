'use client';

import { useEffect, useMemo, useState } from 'react';
import type { Order, OrderStatus } from '@/lib/types';
import StatusFilter from './StatusFilter';
import { subscribe, unsubscribe } from '@/lib/realtime';

export default function OrdersTable({ initialOrders }: { initialOrders: Order[] }) {
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [filter, setFilter] = useState<OrderStatus | 'ALL'>('ALL');

  useEffect(() => {
    const channel = subscribe('orders');
    if (!channel) return;
    const handler = (payload: Order) => {
      setOrders((current) => {
        const i = current.findIndex((o) => o.id === payload.id);
        if (i === -1) return [payload, ...current];
        const copy = [...current];
        copy[i] = { ...copy[i], ...payload };
        return copy;
      });
    };
    channel.bind('order_status_updated', handler);
    return () => {
      channel.unbind('order_status_updated', handler);
      unsubscribe('orders');
    };
  }, []);

  const filtered = useMemo(
    () => (filter === 'ALL' ? orders : orders.filter((o) => o.status === filter)),
    [orders, filter],
  );

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <h2 className="mb-3 text-lg font-semibold text-slate-900">Orders</h2>
      <StatusFilter value={filter} onChange={setFilter} />
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="text-slate-500">
            <tr>
              <th className="pb-2">Order</th>
              <th className="pb-2">Status</th>
              <th className="pb-2">Address</th>
              <th className="pb-2">Amount</th>
              <th className="pb-2">Updated</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((order) => (
              <tr key={order.id} className="border-t border-slate-100">
                <td className="py-2 font-medium text-slate-900">#{order.id.slice(0, 8)}</td>
                <td className="py-2 text-slate-700">{order.status}</td>
                <td className="py-2 text-slate-600">{order.deliveryAddress}</td>
                <td className="py-2 text-slate-700">₦{Number(order.totalAmount).toLocaleString()}</td>
                <td className="py-2 text-slate-500">
                  {new Date(order.updatedAt).toLocaleTimeString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 ? (
          <p className="py-6 text-center text-sm text-slate-500">No orders for this filter.</p>
        ) : null}
      </div>
    </div>
  );
}
