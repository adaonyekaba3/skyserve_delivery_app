'use client';

import { MapContainer, Marker, Popup, TileLayer } from 'react-leaflet';
import L from 'leaflet';
import type { Drone } from '@/lib/types';

const icon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

const lagosCenter: [number, number] = [6.5244, 3.3792];

export default function LiveMap({ drones }: { drones: Drone[] }) {
  return (
    <div className="h-[70vh] overflow-hidden rounded-xl border border-slate-200 bg-white">
      <MapContainer center={lagosCenter} zoom={11} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {drones
          .filter((d) => d.currentLatitude != null && d.currentLongitude != null)
          .map((drone) => (
            <Marker
              key={drone.id}
              position={[Number(drone.currentLatitude), Number(drone.currentLongitude)]}
              icon={icon}
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
  );
}
