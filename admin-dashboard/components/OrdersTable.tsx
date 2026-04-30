'use client';

import { useEffect, useMemo, useState } from 'react';
import type { Order, OrderStatus } from '@/lib/types';
import StatusFilter from './StatusFilter';
import { subscribe, unsubscribe } from '@/lib/realtime';

const STATUS_TONE: Record<OrderStatus, { bg: string; text: string; label: string }> = {
  PENDING: { bg: 'bg-warning-soft', text: 'text-warning', label: 'Pending' },
  ACCEPTED: { bg: 'bg-primary-soft', text: 'text-primary', label: 'Accepted' },
  PREPARING: { bg: 'bg-primary-soft', text: 'text-primary', label: 'Preparing' },
  PICKED_UP: { bg: 'bg-accent-soft', text: 'text-accent', label: 'Picked up' },
  IN_FLIGHT: { bg: 'bg-accent-soft', text: 'text-accent', label: 'In flight' },
  DELIVERED: { bg: 'bg-success-soft', text: 'text-success', label: 'Delivered' },
  CANCELLED: { bg: 'bg-danger-soft', text: 'text-danger', label: 'Cancelled' },
};

function StatusBadge({ status }: { status: OrderStatus }) {
  const tone = STATUS_TONE[status] ?? STATUS_TONE.PENDING;
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${tone.bg} ${tone.text}`}
    >
      {tone.label}
    </span>
  );
}

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
    <div className="rounded-lg border border-border bg-surface p-5 shadow-card">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-text">Orders</h2>
          <p className="text-xs text-muted">
            {filtered.length} {filtered.length === 1 ? 'order' : 'orders'} \u00B7 live updates
          </p>
        </div>
      </div>
      <StatusFilter value={filter} onChange={setFilter} />
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead>
            <tr className="border-b border-border text-xs uppercase tracking-wider text-subtle">
              <th className="pb-3 pr-4 font-semibold">Order</th>
              <th className="pb-3 pr-4 font-semibold">Status</th>
              <th className="pb-3 pr-4 font-semibold">Address</th>
              <th className="pb-3 pr-4 font-semibold">Amount</th>
              <th className="pb-3 font-semibold">Updated</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((order) => (
              <tr
                key={order.id}
                className="border-b border-hairline last:border-b-0 transition-colors hover:bg-bg"
              >
                <td className="py-3 pr-4 font-semibold text-text">#{order.id.slice(0, 8)}</td>
                <td className="py-3 pr-4">
                  <StatusBadge status={order.status} />
                </td>
                <td className="py-3 pr-4 text-muted">{order.deliveryAddress}</td>
                <td className="py-3 pr-4 font-semibold text-text">
                  &#8358;{Number(order.totalAmount).toLocaleString()}
                </td>
                <td className="py-3 text-subtle">
                  {new Date(order.updatedAt).toLocaleTimeString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 ? (
          <div className="py-10 text-center">
            <p className="text-2xl">📭</p>
            <p className="mt-2 text-sm font-medium text-text">No orders for this filter</p>
            <p className="mt-1 text-xs text-muted">Try selecting a different status.</p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
