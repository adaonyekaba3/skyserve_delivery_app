'use client';

import { useEffect, useMemo, useState } from 'react';
import { Plane, Battery, MapPin, Wrench, Power } from 'lucide-react';
import type { Drone } from '@/lib/types';
import { subscribe, unsubscribe } from '@/lib/realtime';
import { Card, PageHero, SectionHeader, Badge, EmptyState } from './ui';
import type { BadgeTone } from './ui';

const DRONE_STATUS: Record<
  Drone['status'],
  { label: string; tone: BadgeTone }
> = {
  IDLE: { label: 'Idle', tone: 'neutral' },
  DELIVERING: { label: 'In flight', tone: 'gold' },
  CHARGING: { label: 'Charging', tone: 'primary' },
  MAINTENANCE: { label: 'Maintenance', tone: 'danger' },
};

function batteryBarClass(pct: number) {
  if (pct >= 60) return 'bg-success';
  if (pct >= 30) return 'bg-warning';
  return 'bg-danger';
}

export default function DroneList({
  initialDrones,
}: {
  initialDrones: Drone[];
}) {
  const [drones, setDrones] = useState(initialDrones);

  useEffect(() => {
    const channel = subscribe('drones');
    if (!channel) return;
    const handler = (payload: Drone) => {
      setDrones((current) => {
        const i = current.findIndex(
          (d) => d.id === payload.id || d.code === payload.code,
        );
        if (i === -1) return [payload, ...current];
        const copy = [...current];
        copy[i] = { ...copy[i], ...payload };
        return copy;
      });
    };
    channel.bind('drone_location_updated', handler);
    return () => {
      channel.unbind('drone_location_updated', handler);
      unsubscribe('drones');
    };
  }, []);

  const summary = useMemo(() => {
    const acc = { idle: 0, delivering: 0, charging: 0, maintenance: 0 };
    for (const d of drones) {
      if (d.status === 'IDLE') acc.idle += 1;
      else if (d.status === 'DELIVERING') acc.delivering += 1;
      else if (d.status === 'CHARGING') acc.charging += 1;
      else if (d.status === 'MAINTENANCE') acc.maintenance += 1;
    }
    return acc;
  }, [drones]);

  return (
    <div className="space-y-6">
      <PageHero
        title="Drone fleet"
        subtitle="Live battery and location telemetry across all units."
        icon={Plane}
        trailing={
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white/80">
            <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-accent" />
            Streaming
          </span>
        }
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat
          label="In flight"
          value={summary.delivering}
          accent="gold"
          icon={Plane}
        />
        <Stat label="Idle" value={summary.idle} accent="navy" icon={Power} />
        <Stat
          label="Charging"
          value={summary.charging}
          accent="navy"
          icon={Battery}
        />
        <Stat
          label="Maintenance"
          value={summary.maintenance}
          accent="danger"
          icon={Wrench}
        />
      </div>

      <Card padding="lg">
        <SectionHeader
          label="ACTIVE FLEET"
          hint={`${drones.length} drones registered`}
        />
        {drones.length === 0 ? (
          <EmptyState
            icon={
              <Plane
                size={20}
                color="#0B1C2C"
                style={{ transform: 'rotate(45deg)' }}
              />
            }
            title="No drones registered"
            description="Run the seed script (npm run db:seed) to provision a fleet for testing."
          />
        ) : (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {drones.map((drone) => {
              const status = DRONE_STATUS[drone.status] ?? DRONE_STATUS.IDLE;
              const pct = Math.max(
                0,
                Math.min(100, Number(drone.batteryPct ?? 0)),
              );
              return (
                <div
                  key={drone.id}
                  className="rounded-lg border border-border bg-bg p-4 transition-shadow hover:shadow-card"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <Plane
                          size={16}
                          color="#C6A052"
                          style={{ transform: 'rotate(45deg)' }}
                        />
                        <p className="font-bold text-text">{drone.code}</p>
                      </div>
                      <p className="mt-1 inline-flex items-center gap-1 text-xs text-muted">
                        <MapPin size={11} />
                        {drone.currentLatitude ?? '—'},{' '}
                        {drone.currentLongitude ?? '—'}
                      </p>
                    </div>
                    <Badge label={status.label} tone={status.tone} size="sm" />
                  </div>

                  <div className="mt-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-muted inline-flex items-center gap-1">
                        <Battery size={11} color="#C6A052" /> Battery
                      </span>
                      <span className="font-semibold text-text">{pct}%</span>
                    </div>
                    <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-hairline">
                      <div
                        className={`h-full rounded-full transition-all ${batteryBarClass(pct)}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>

                  {drone.activeDeliveryId ? (
                    <p className="mt-2 text-xs text-muted">
                      Active delivery:{' '}
                      <span className="font-mono text-text">
                        {drone.activeDeliveryId.slice(0, 8)}
                      </span>
                    </p>
                  ) : null}
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}

interface StatProps {
  label: string;
  value: number;
  accent: 'gold' | 'navy' | 'danger';
  icon: typeof Plane;
}

function Stat({ label, value, accent, icon: Icon }: StatProps) {
  const dotColor =
    accent === 'gold' ? '#C6A052' : accent === 'danger' ? '#DC2626' : '#0B1C2C';
  return (
    <Card padding="md">
      <div className="flex items-center gap-2">
        <Icon size={14} color={dotColor} />
        <span className="text-[11px] uppercase tracking-[0.16em] font-semibold text-subtle">
          {label}
        </span>
      </div>
      <p className="mt-1.5 text-2xl font-bold text-text">{value}</p>
    </Card>
  );
}
