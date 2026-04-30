'use client';

import { useEffect, useMemo, useState } from 'react';
import { Inbox, AlertTriangle, Clock } from 'lucide-react';
import type { Order, OrderStatus } from '@/lib/types';
import StatusFilter from './StatusFilter';
import { subscribe, unsubscribe } from '@/lib/realtime';
import {
  Card,
  PageHero,
  SectionHeader,
  Badge,
  statusToBadge,
  EmptyState,
} from './ui';

const FIVE_MIN_MS = 5 * 60 * 1000;

function relativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const sec = Math.max(0, Math.floor(diffMs / 1000));
  if (sec < 60) return `${sec}s ago`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  return `${Math.floor(hr / 24)}d ago`;
}

function isUnprocessed(order: Order): boolean {
  if (order.status !== 'PENDING') return false;
  return Date.now() - new Date(order.createdAt).getTime() > FIVE_MIN_MS;
}

export default function OrdersTable({
  initialOrders,
}: {
  initialOrders: Order[];
}) {
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
    () =>
      filter === 'ALL' ? orders : orders.filter((o) => o.status === filter),
    [orders, filter],
  );

  const unprocessedCount = orders.filter(isUnprocessed).length;

  return (
    <div className="space-y-6">
      <PageHero
        title="Order queue"
        subtitle="Live order pipeline. Pending orders older than 5 minutes are flagged."
        icon={Inbox}
        trailing={
          unprocessedCount > 0 ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-warning/20 px-3 py-1 text-xs font-semibold text-accent">
              <AlertTriangle size={12} color="#C6A052" />
              {unprocessedCount} unprocessed
            </span>
          ) : null
        }
      />

      <Card padding="lg">
        <SectionHeader
          label="ALL ORDERS"
          hint={`${filtered.length} ${filtered.length === 1 ? 'order' : 'orders'} • live updates`}
        />
        <StatusFilter value={filter} onChange={setFilter} />
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border text-[11px] uppercase tracking-[0.16em] text-subtle">
                <th className="pb-3 pr-4 font-semibold">Order</th>
                <th className="pb-3 pr-4 font-semibold">Status</th>
                <th className="pb-3 pr-4 font-semibold">Address</th>
                <th className="pb-3 pr-4 font-semibold">Amount</th>
                <th className="pb-3 font-semibold">Updated</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((order) => {
                const tone = statusToBadge(order.status);
                const unprocessed = isUnprocessed(order);
                return (
                  <tr
                    key={order.id}
                    className={`border-b border-hairline last:border-b-0 transition-colors hover:bg-bg ${
                      unprocessed
                        ? 'bg-warning-soft/40 border-l-4 border-l-warning'
                        : ''
                    }`}
                  >
                    <td className="py-3 pr-4">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-semibold text-text">
                          #{order.id.slice(0, 8)}
                        </span>
                        {unprocessed ? (
                          <Badge label="Unprocessed" tone="warning" size="sm" />
                        ) : null}
                      </div>
                      <p className="mt-0.5 text-[11px] text-subtle flex items-center gap-1">
                        <Clock size={10} /> {relativeTime(order.createdAt)}
                      </p>
                    </td>
                    <td className="py-3 pr-4">
                      <Badge label={tone.label} tone={tone.tone} size="sm" />
                    </td>
                    <td className="py-3 pr-4 text-muted">
                      {order.deliveryAddress}
                    </td>
                    <td className="py-3 pr-4 font-semibold text-text">
                      ₦{Number(order.totalAmount).toLocaleString()}
                    </td>
                    <td className="py-3 text-subtle">
                      {new Date(order.updatedAt).toLocaleTimeString()}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filtered.length === 0 ? (
            <EmptyState
              icon={<Inbox size={20} color="#0B1C2C" />}
              title="No orders for this filter"
              description="Try a different status or wait for new orders to come in."
            />
          ) : null}
        </div>
      </Card>
    </div>
  );
}
