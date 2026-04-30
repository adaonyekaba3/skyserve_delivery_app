'use client';

import { useEffect, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  CalendarDays,
  Plane,
  Timer,
  Bike,
  MapPin,
  Activity,
  Inbox,
} from 'lucide-react';
import {
  Card,
  MetricCard,
  PageHero,
  SectionHeader,
  Badge,
  statusToBadge,
  Button,
} from './ui';
import {
  fetchAdminOverview,
  fetchOrders,
  patchOrderStatus,
} from '@/lib/api.client';
import { useAdminBus } from '@/lib/useAdminBus';
import type { AdminOverview, LagosZone, Order } from '@/lib/types';
import { LAGOS_ZONES } from '@/lib/types';

interface OverviewClientProps {
  initialOverview: AdminOverview;
  initialOrders: Order[];
}

function formatMinutes(value: number): string {
  if (!value || Number.isNaN(value)) return 'No data';
  if (value >= 60) {
    const h = Math.floor(value / 60);
    const m = Math.round(value % 60);
    return `${h}h ${m}m`;
  }
  return `${value.toFixed(1)} min`;
}

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

export default function OverviewClient({
  initialOverview,
  initialOrders,
}: OverviewClientProps) {
  const [overview, setOverview] = useState<AdminOverview>(initialOverview);
  const [orders, setOrders] = useState<Order[]>(initialOrders);

  const refresh = async () => {
    try {
      const [ov, os] = await Promise.all([fetchAdminOverview(), fetchOrders()]);
      setOverview(ov);
      setOrders(os);
    } catch {
      // ignore transient API failures; we'll retry on next interval
    }
  };

  useEffect(() => {
    const i = setInterval(refresh, 30_000);
    return () => clearInterval(i);
  }, []);

  useAdminBus({
    onOrderChanged: () => {
      refresh();
    },
    onDroneChanged: () => {
      refresh();
    },
  });

  const acceptedHandler = async (id: string) => {
    try {
      const updated = await patchOrderStatus(id, 'ACCEPTED');
      setOrders((prev) => prev.map((o) => (o.id === updated.id ? updated : o)));
    } catch {
      // optimistic update intentionally suppressed; row will refresh on next event
    }
  };

  const zoneData: Array<{ zone: LagosZone; users: number }> = LAGOS_ZONES.map(
    (zone) => ({
      zone,
      users: overview.activeUsersByZone?.[zone] ?? 0,
    }),
  );

  const recentOrders = orders.slice(0, 6);

  return (
    <div className="space-y-6">
      <PageHero
        title="Mission control"
        subtitle="Live picture of orders, drones, and Lagos zone adoption."
        icon={Activity}
        trailing={
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white/80">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-accent" />
            Live
          </span>
        }
      />

      <div>
        <SectionHeader
          label="KEY METRICS"
          hint="Refreshes every 30s and on live events"
        />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            icon={CalendarDays}
            label="Orders today"
            value={overview.ordersToday}
            sub={`${overview.ordersWeek} / 7d • ${overview.ordersMonth} / 30d`}
          />
          <MetricCard
            icon={Plane}
            label="Active drone runs"
            value={overview.activeDeliveries}
            sub="Currently delivering"
            tone="navy"
          />
          <MetricCard
            icon={Timer}
            label="Avg delivery time"
            value={formatMinutes(overview.avgDeliveryMinutes)}
            sub="Target: 10–15 min"
          />
          <MetricCard
            icon={Bike}
            label="Motorcycle trips avoided"
            value={overview.motorcycleTripsAvoided}
            sub="Each delivered drone order replaces a bike run"
            tone="gold"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2" padding="lg">
          <SectionHeader
            label="ACTIVE USERS BY LUXURY ZONE"
            hint="Distinct customers ordering into Ikoyi, VI, Lekki, Banana, Eko Atlantic"
          />
          <div className="h-64 -ml-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={zoneData}
                margin={{ top: 8, right: 16, bottom: 8, left: 16 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#F1F5F9"
                  vertical={false}
                />
                <XAxis
                  dataKey="zone"
                  tick={{ fontSize: 11, fill: '#64748B' }}
                  axisLine={{ stroke: '#E5E7EB' }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: '#64748B' }}
                  axisLine={{ stroke: '#E5E7EB' }}
                  tickLine={false}
                  allowDecimals={false}
                />
                <Tooltip
                  cursor={{ fill: 'rgba(11, 28, 44, 0.04)' }}
                  contentStyle={{
                    borderRadius: 10,
                    border: '1px solid #E5E7EB',
                    fontSize: 12,
                  }}
                />
                <Bar dataKey="users" fill="#0B1C2C" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card padding="lg">
          <SectionHeader
            label="ZONE BREAKDOWN"
            hint="Where to focus operator coverage next"
          />
          <ul className="space-y-2.5">
            {zoneData.map((row) => (
              <li
                key={row.zone}
                className="flex items-center justify-between text-sm"
              >
                <span className="flex items-center gap-2 text-text">
                  <MapPin size={12} color="#C6A052" />
                  {row.zone}
                </span>
                <span className="font-bold text-text">{row.users}</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <Card padding="lg">
        <SectionHeader
          label="RECENT ACTIVITY"
          hint="Latest orders across all restaurants"
          action={
            <Button
              label="View orders"
              size="sm"
              variant="secondary"
              onClick={() => {
                window.location.href = '/orders';
              }}
            />
          }
        />
        {recentOrders.length === 0 ? (
          <div className="flex items-center gap-3 rounded-md bg-hairline px-4 py-6 text-sm text-muted">
            <Inbox size={16} />
            No orders yet. Once customers check out from the app, they will
            appear here in real time.
          </div>
        ) : (
          <ul className="divide-y divide-hairline">
            {recentOrders.map((order) => {
              const tone = statusToBadge(order.status);
              const isPending = order.status === 'PENDING';
              return (
                <li
                  key={order.id}
                  className="flex items-center justify-between py-3 text-sm"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs text-muted">
                        #{order.id.slice(0, 8)}
                      </span>
                      <Badge label={tone.label} tone={tone.tone} size="sm" />
                    </div>
                    <p className="mt-0.5 truncate text-xs text-muted">
                      {order.deliveryAddress}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 pl-4">
                    <div className="text-right">
                      <p className="text-sm font-bold text-text">
                        ₦{Number(order.totalAmount).toLocaleString()}
                      </p>
                      <p className="text-[11px] text-subtle">
                        {relativeTime(order.createdAt)}
                      </p>
                    </div>
                    {isPending ? (
                      <Button
                        label="Accept"
                        size="sm"
                        onClick={() => acceptedHandler(order.id)}
                      />
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </div>
  );
}
