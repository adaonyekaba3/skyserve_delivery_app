'use client';

import { Circle, MapContainer, Marker, Popup, TileLayer } from 'react-leaflet';
import L from 'leaflet';
import { useEffect, useState } from 'react';
import { Map as MapIcon, MapPin } from 'lucide-react';
import type { Drone, LagosZone } from '@/lib/types';
import { Card, PageHero, SectionHeader } from './ui';
import { subscribe, unsubscribe } from '@/lib/realtime';

interface ZoneDef {
  name: LagosZone;
  center: [number, number];
  radiusMeters: number;
}

const ZONES: ZoneDef[] = [
  { name: 'Ikoyi', center: [6.4541, 3.4316], radiusMeters: 1700 },
  { name: 'Victoria Island', center: [6.4281, 3.4216], radiusMeters: 1900 },
  { name: 'Lekki Phase 1', center: [6.4438, 3.4738], radiusMeters: 2200 },
  { name: 'Lekki Phase 2', center: [6.4391, 3.5269], radiusMeters: 2400 },
  { name: 'Banana Island', center: [6.4429, 3.4453], radiusMeters: 800 },
  { name: 'Eko Atlantic', center: [6.4046, 3.4131], radiusMeters: 1600 },
];

const lagosCenter: [number, number] = [6.4541, 3.45];

function makeDroneIcon(status: Drone['status']): L.DivIcon {
  const color =
    status === 'DELIVERING'
      ? '#C6A052'
      : status === 'CHARGING'
        ? '#0B1C2C'
        : status === 'MAINTENANCE'
          ? '#DC2626'
          : '#94A3B8';
  return L.divIcon({
    className: '',
    html: `<div style="
      transform: rotate(45deg);
      background: ${color};
      width: 16px;
      height: 16px;
      border-radius: 4px;
      border: 2px solid #ffffff;
      box-shadow: 0 1px 4px rgba(11,28,44,0.35);
    "></div>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
  });
}

interface LiveMapProps {
  initialDrones: Drone[];
}

export default function LiveMap({ initialDrones }: LiveMapProps) {
  const [drones, setDrones] = useState<Drone[]>(initialDrones);

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

  const zoneCounts = ZONES.map((zone) => {
    const count = drones.filter((d) => isInZone(d, zone)).length;
    return { ...zone, count };
  });

  return (
    <div className="space-y-6">
      <PageHero
        title="Live coverage map"
        subtitle="Drones overlaid on Lagos luxury delivery zones."
        icon={MapIcon}
        trailing={
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white/80">
            <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-accent" />
            Streaming
          </span>
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
        <Card padding="none" className="overflow-hidden lg:col-span-3" elevated>
          <div className="h-[65vh]">
            <MapContainer
              center={lagosCenter}
              zoom={12}
              style={{ height: '100%', width: '100%' }}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />

              {ZONES.map((zone) => (
                <Circle
                  key={zone.name}
                  center={zone.center}
                  radius={zone.radiusMeters}
                  pathOptions={{
                    color: '#C6A052',
                    weight: 1.5,
                    fillColor: '#C6A052',
                    fillOpacity: 0.08,
                  }}
                >
                  <Popup>
                    <strong>{zone.name}</strong>
                  </Popup>
                </Circle>
              ))}

              {drones
                .filter(
                  (d) =>
                    d.currentLatitude != null && d.currentLongitude != null,
                )
                .map((drone) => (
                  <Marker
                    key={drone.id}
                    position={[
                      Number(drone.currentLatitude),
                      Number(drone.currentLongitude),
                    ]}
                    icon={makeDroneIcon(drone.status)}
                  >
                    <Popup>
                      <strong>{drone.code}</strong>
                      <br />
                      Status: {drone.status}
                      <br />
                      Battery: {drone.batteryPct}%
                    </Popup>
                  </Marker>
                ))}
            </MapContainer>
          </div>
        </Card>

        <Card padding="lg" className="lg:col-span-1">
          <SectionHeader
            label="ZONES"
            hint="Drones currently inside each delivery ring"
          />
          <ul className="space-y-2.5">
            {zoneCounts.map((zone) => (
              <li
                key={zone.name}
                className="flex items-center justify-between text-sm"
              >
                <span className="flex items-center gap-2 text-text">
                  <MapPin size={12} color="#C6A052" />
                  {zone.name}
                </span>
                <span className="font-bold text-text">{zone.count}</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}

function isInZone(drone: Drone, zone: ZoneDef): boolean {
  if (drone.currentLatitude == null || drone.currentLongitude == null)
    return false;
  const lat = Number(drone.currentLatitude);
  const lng = Number(drone.currentLongitude);
  const distance = haversineMeters(lat, lng, zone.center[0], zone.center[1]);
  return distance <= zone.radiusMeters;
}

function haversineMeters(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const R = 6371000;
  const toRad = (x: number) => (x * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}
