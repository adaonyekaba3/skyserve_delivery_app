import React from 'react';
import { Text, View } from 'react-native';
import { Icon } from '../ui';

interface Props {
  origin: { latitude: number; longitude: number } | null;
  destination: { latitude: number; longitude: number } | null;
  drone: { latitude: number; longitude: number } | null;
  status: string;
}

export default function DroneCanvas({
  origin,
  destination,
  drone,
  status,
}: Props) {
  const progress = computeProgress(origin, destination, drone);

  return (
    <View>
      <View
        className="bg-primary-soft rounded-lg overflow-hidden"
        style={{ height: 96 }}
      >
        <View
          className="absolute left-0 top-1/2 h-0.5 bg-primary/30"
          style={{ width: '100%' }}
        />
        <View
          className="absolute top-1/2 h-1 bg-accent rounded-full"
          style={{ width: `${Math.round(progress * 100)}%` }}
        />
        <View className="absolute h-9 w-9 rounded-full bg-primary items-center justify-center top-3 left-3">
          <Text
            className="text-white text-[10px]"
            style={{ fontFamily: 'Inter_700Bold' }}
          >
            REST
          </Text>
        </View>
        <View className="absolute h-9 w-9 rounded-full bg-accent items-center justify-center top-3 right-3">
          <Text
            className="text-text text-[10px]"
            style={{ fontFamily: 'Inter_700Bold' }}
          >
            YOU
          </Text>
        </View>
        <View
          className="absolute h-10 w-10 rounded-full bg-white border-2 border-primary items-center justify-center"
          style={{
            top: 8,
            left: `${progress * 100}%`,
            transform: [{ translateX: -20 }],
          }}
        >
          <Icon
            name="navigation"
            size={18}
            color="#0B1C2C"
            style={{ transform: [{ rotate: '45deg' }] }}
          />
        </View>
      </View>
      <View className="mt-3">
        <Text
          className="text-text text-sm"
          style={{ fontFamily: 'Inter_600SemiBold' }}
        >
          Status: {status}
        </Text>
        {drone ? (
          <Text
            className="text-muted text-xs mt-1"
            style={{ fontFamily: 'Inter_400Regular' }}
          >
            Position: {drone.latitude.toFixed(4)}, {drone.longitude.toFixed(4)}
          </Text>
        ) : (
          <Text
            className="text-muted text-xs mt-1"
            style={{ fontFamily: 'Inter_400Regular' }}
          >
            Awaiting drone telemetry...
          </Text>
        )}
      </View>
    </View>
  );
}

function computeProgress(
  origin: Props['origin'],
  destination: Props['destination'],
  drone: Props['drone'],
): number {
  if (!origin || !destination || !drone) return 0;
  const total = haversine(origin, destination);
  if (!total) return 0;
  const remaining = haversine(drone, destination);
  const ratio = 1 - remaining / total;
  return Math.max(0, Math.min(1, ratio));
}

function haversine(
  a: { latitude: number; longitude: number },
  b: { latitude: number; longitude: number },
) {
  const R = 6371;
  const dLat = ((b.latitude - a.latitude) * Math.PI) / 180;
  const dLon = ((b.longitude - a.longitude) * Math.PI) / 180;
  const lat1 = (a.latitude * Math.PI) / 180;
  const lat2 = (b.latitude * Math.PI) / 180;
  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.sin(dLon / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
  return 2 * R * Math.asin(Math.sqrt(x));
}
