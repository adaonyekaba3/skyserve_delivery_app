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
import { Bike, Wind, Leaf, Users, TrendingUp, Info } from 'lucide-react';
import { Card, MetricCard, PageHero, SectionHeader } from './ui';
import { fetchAdminInsights } from '@/lib/api.client';
import { useAdminBus } from '@/lib/useAdminBus';
import type { AdminInsights } from '@/lib/types';

interface InsightsClientProps {
  initialInsights: AdminInsights;
}

function formatPct(value: number): string {
  return `${value.toFixed(1)}%`;
}

function formatKg(value: number): string {
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)} t`;
  }
  return `${value.toFixed(1)} kg`;
}

export default function InsightsClient({
  initialInsights,
}: InsightsClientProps) {
  const [data, setData] = useState<AdminInsights>(initialInsights);

  const refresh = async () => {
    try {
      const next = await fetchAdminInsights();
      setData(next);
    } catch {
      // swallow refresh failures; data stays at last good value
    }
  };

  useEffect(() => {
    const i = setInterval(refresh, 60_000);
    return () => clearInterval(i);
  }, []);

  useAdminBus({
    onOrderChanged: () => {
      refresh();
    },
  });

  const formattedDays = data.ordersByDay.map((d) => ({
    label: new Date(d.date).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
    }),
    count: d.count,
  }));

  return (
    <div className="space-y-6">
      <PageHero
        title="Urban impact"
        subtitle="Behavioural shift from motorcycle dispatch to drone delivery in Lagos."
        icon={TrendingUp}
        trailing={
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white/80">
            Mission KPIs
          </span>
        }
      />

      <div>
        <SectionHeader
          label="ESTIMATED IMPACT"
          hint="Aggregated across all delivered drone orders"
        />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            icon={Bike}
            label="Motorcycle trips avoided"
            value={data.motorcycleTripsAvoided}
            sub="One drone delivery = one fewer bike run"
            tone="navy"
          />
          <MetricCard
            icon={Wind}
            label="Traffic reduction"
            value={formatPct(data.estimatedTrafficReductionPct)}
            sub="vs baseline last-mile dispatch"
            tone="gold"
          />
          <MetricCard
            icon={Leaf}
            label="CO₂ avoided"
            value={formatKg(data.carbonKgSaved)}
            sub="Estimated tailpipe emissions saved"
          />
          <MetricCard
            icon={Users}
            label="Drone adoption rate"
            value={formatPct(data.droneAdoptionRatePct)}
            sub="Customers who completed a drone order"
          />
        </div>
      </div>

      <Card padding="lg">
        <SectionHeader
          label="ORDERS BY DAY"
          hint="Last 14 days. Use this to see adoption trend."
        />
        {formattedDays.length === 0 ? (
          <div className="flex items-center gap-3 rounded-md bg-hairline px-4 py-6 text-sm text-muted">
            <Info size={16} />
            Not enough order history yet to chart the last 14 days.
          </div>
        ) : (
          <div className="h-72 -ml-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={formattedDays}
                margin={{ top: 8, right: 16, bottom: 8, left: 16 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#F1F5F9"
                  vertical={false}
                />
                <XAxis
                  dataKey="label"
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
                <Bar dataKey="count" fill="#C6A052" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </Card>

      <Card padding="lg">
        <SectionHeader label="HOW WE CALCULATE" />
        <div className="space-y-3 text-sm leading-6 text-muted">
          <p>
            <span className="font-semibold text-text">
              Motorcycle trips avoided
            </span>{' '}
            is equal to the count of orders with status <code>DELIVERED</code>.
            Each completed drone delivery is treated as a one-for-one
            displacement of a motorcycle dispatch run.
          </p>
          <p>
            <span className="font-semibold text-text">Traffic reduction</span>{' '}
            is a blended estimate against a baseline of 5,000 same-zone bike
            trips and grows asymptotically as drone volume scales.
          </p>
          <p>
            <span className="font-semibold text-text">CO₂ avoided</span> assumes
            0.95 kg of CO₂ per replaced motorcycle trip in dense Lagos traffic,
            derived from average idle + crawl emissions for 125cc bikes used in
            last-mile delivery.
          </p>
          <p>
            <span className="font-semibold text-text">Drone adoption rate</span>{' '}
            is the share of registered customers who have at least one delivered
            drone order.
          </p>
        </div>
      </Card>
    </div>
  );
}
