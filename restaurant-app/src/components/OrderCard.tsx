import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import type { Order } from '../services/types';

const STATUS_COLORS: Record<string, string> = {
  PENDING: '#f59e0b',
  ACCEPTED: '#3b82f6',
  PREPARING: '#8b5cf6',
  PICKED_UP: '#0ea5e9',
  IN_FLIGHT: '#0ea5e9',
  DELIVERED: '#16a34a',
  CANCELLED: '#dc2626',
};

interface Props {
  order: Order;
  onPress: () => void;
}

export default function OrderCard({ order, onPress }: Props) {
  const color = STATUS_COLORS[order.status] ?? '#475569';
  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      <View style={styles.row}>
        <Text style={styles.id}>#{order.id.slice(0, 8)}</Text>
        <View style={[styles.badge, { backgroundColor: color }]}>
          <Text style={styles.badgeText}>{order.status}</Text>
        </View>
      </View>
      <Text style={styles.address}>{order.deliveryAddress}</Text>
      <Text style={styles.amount}>₦{Number(order.totalAmount).toLocaleString()}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 12,
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  id: { fontWeight: '600', color: '#0f172a' },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999 },
  badgeText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  address: { color: '#64748b', marginTop: 6 },
  amount: { color: '#0f172a', marginTop: 6, fontWeight: '500' },
});
