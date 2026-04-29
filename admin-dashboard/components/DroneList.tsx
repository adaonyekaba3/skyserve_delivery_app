'use client';

import { useEffect, useState } from 'react';
import type { Drone } from '@/lib/types';
import { subscribe, unsubscribe } from '@/lib/realtime';

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
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <h2 className="mb-3 text-lg font-semibold text-slate-900">Drone Fleet</h2>
      <div className="space-y-2">
        {drones.map((drone) => (
          <div
            key={drone.id}
            className="flex items-center justify-between rounded-lg border border-slate-100 px-3 py-2"
          >
            <div>
              <p className="font-medium text-slate-900">{drone.code}</p>
              <p className="text-xs text-slate-500">
                {drone.currentLatitude ?? '-'}, {drone.currentLongitude ?? '-'}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-slate-700">{drone.status}</p>
              <p className="text-xs text-slate-500">{drone.batteryPct}% battery</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
