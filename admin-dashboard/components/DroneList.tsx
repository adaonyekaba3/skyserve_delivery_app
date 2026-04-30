'use client';

import { useEffect, useState } from 'react';
import type { Drone } from '@/lib/types';
import { subscribe, unsubscribe } from '@/lib/realtime';

const DRONE_STATUS: Record<
  Drone['status'],
  { label: string; bg: string; text: string }
> = {
  IDLE: { label: 'Idle', bg: 'bg-hairline', text: 'text-muted' },
  DELIVERING: { label: 'Delivering', bg: 'bg-accent-soft', text: 'text-accent' },
  CHARGING: { label: 'Charging', bg: 'bg-primary-soft', text: 'text-primary' },
  MAINTENANCE: { label: 'Maintenance', bg: 'bg-danger-soft', text: 'text-danger' },
};

function batteryColor(pct: number) {
  if (pct >= 60) return 'bg-success';
  if (pct >= 30) return 'bg-warning';
  return 'bg-danger';
}

export default function DroneList({ initialDrones }: { initialDrones: Drone[] }) {
  const [drones, setDrones] = useState(initialDrones);

  useEffect(() => {
    const channel = subscribe('drones');
    if (!channel) return;
    const handler = (payload: Drone) => {
      setDrones((current) => {
        const i = current.findIndex((d) => d.id === payload.id || d.code === payload.code);
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

  return (
    <div className="rounded-lg border border-border bg-surface p-5 shadow-card">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-text">Drone Fleet</h2>
          <p className="text-xs text-muted">{drones.length} drones \u00B7 live telemetry</p>
        </div>
        <span className="inline-flex items-center rounded-full bg-success-soft px-3 py-1 text-xs font-semibold text-success">
          <span className="mr-1.5 inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-success" />
          Streaming
        </span>
      </div>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {drones.map((drone) => {
          const status = DRONE_STATUS[drone.status] ?? DRONE_STATUS.IDLE;
          const pct = Math.max(0, Math.min(100, Number(drone.batteryPct ?? 0)));
          return (
            <div
              key={drone.id}
              className="rounded-lg border border-border bg-bg p-4 transition-shadow hover:shadow-card"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-base">🚁</span>
                    <p className="font-bold text-text">{drone.code}</p>
                  </div>
                  <p className="mt-1 text-xs text-muted">
                    {drone.currentLatitude ?? '—'}, {drone.currentLongitude ?? '—'}
                  </p>
                </div>
                <span
                  className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${status.bg} ${status.text}`}
                >
                  {status.label}
                </span>
              </div>
              <div className="mt-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-muted">Battery</span>
                  <span className="font-semibold text-text">{pct}%</span>
                </div>
                <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-hairline">
                  <div
                    className={`h-full rounded-full transition-all ${batteryColor(pct)}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
              {drone.activeDeliveryId ? (
                <p className="mt-2 text-xs text-muted">
                  Active delivery: <span className="font-mono text-text">{drone.activeDeliveryId.slice(0, 8)}</span>
                </p>
              ) : null}
            </div>
          );
        })}
      </div>
      {drones.length === 0 ? (
        <div className="py-10 text-center">
          <p className="text-2xl">🚁</p>
          <p className="mt-2 text-sm font-medium text-text">No drones registered</p>
          <p className="mt-1 text-xs text-muted">Run the seed script to provision a fleet.</p>
        </div>
      ) : null}
    </div>
  );
}
