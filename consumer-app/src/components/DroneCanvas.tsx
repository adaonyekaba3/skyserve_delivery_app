import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface Props {
  origin: { latitude: number; longitude: number } | null;
  destination: { latitude: number; longitude: number } | null;
  drone: { latitude: number; longitude: number } | null;
  status: string;
}

/**
 * Simple 2D canvas using positioned views: shows restaurant (origin),
 * customer (destination), and the drone marker as a percentage between
 * the two coordinates. No external map library.
 */
export default function DroneCanvas({ origin, destination, drone, status }: Props) {
  const progress = computeProgress(origin, destination, drone);

  return (
    <View style={styles.box}>
      <View style={styles.track}>
        <View style={[styles.marker, styles.originMarker]}>
          <Text style={styles.markerText}>R</Text>
        </View>
        <View style={[styles.marker, styles.destinationMarker]}>
          <Text style={styles.markerText}>You</Text>
        </View>
        <View style={[styles.drone, { left: `${progress * 100}%` }]}>
          <Text style={styles.droneEmoji}>UAV</Text>
        </View>
      </View>
      <View style={styles.metaRow}>
        <Text style={styles.meta}>Status: {status}</Text>
        {drone ? (
          <Text style={styles.meta}>
            {drone.latitude.toFixed(4)}, {drone.longitude.toFixed(4)}
          </Text>
        ) : (
          <Text style={styles.meta}>Awaiting drone telemetry…</Text>
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

function haversine(a: { latitude: number; longitude: number }, b: { latitude: number; longitude: number }) {
  const R = 6371;
  const dLat = ((b.latitude - a.latitude) * Math.PI) / 180;
  const dLon = ((b.longitude - a.longitude) * Math.PI) / 180;
  const lat1 = (a.latitude * Math.PI) / 180;
  const lat2 = (b.latitude * Math.PI) / 180;
  const x =
    Math.sin(dLat / 2) ** 2 + Math.sin(dLon / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
  return 2 * R * Math.asin(Math.sqrt(x));
}

const styles = StyleSheet.create({
  box: { padding: 16 },
  track: {
    height: 80,
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  marker: {
    position: 'absolute',
    top: 28,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#0f172a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  originMarker: { left: 4 },
  destinationMarker: { right: 4 },
  markerText: { color: '#fff', fontSize: 11, fontWeight: '600' },
  drone: {
    position: 'absolute',
    top: 12,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#16a34a',
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ translateX: -18 }],
  },
  droneEmoji: { color: '#fff', fontSize: 11, fontWeight: '700' },
  metaRow: { marginTop: 12 },
  meta: { color: '#475569', fontSize: 13, marginTop: 2 },
});
