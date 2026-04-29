import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { OrderStatus } from '../services/types';

const STAGES: OrderStatus[] = [
  'PENDING',
  'ACCEPTED',
  'PREPARING',
  'PICKED_UP',
  'IN_FLIGHT',
  'DELIVERED',
];

const LABELS: Record<OrderStatus, string> = {
  PENDING: 'Order placed',
  ACCEPTED: 'Accepted',
  PREPARING: 'Preparing',
  PICKED_UP: 'Picked up',
  IN_FLIGHT: 'In flight',
  DELIVERED: 'Delivered',
  CANCELLED: 'Cancelled',
};

interface Props {
  status: OrderStatus;
}

export default function StatusTimeline({ status }: Props) {
  if (status === 'CANCELLED') {
    return (
      <View style={styles.cancelled}>
        <Text style={styles.cancelText}>Order cancelled</Text>
      </View>
    );
  }
  const currentIndex = STAGES.indexOf(status);
  return (
    <View style={styles.list}>
      {STAGES.map((s, i) => {
        const reached = i <= currentIndex;
        return (
          <View key={s} style={styles.row}>
            <View style={[styles.dot, reached && styles.dotActive]} />
            {i < STAGES.length - 1 ? (
              <View style={[styles.line, reached && i < currentIndex && styles.lineActive]} />
            ) : null}
            <Text style={[styles.label, reached && styles.labelActive]}>{LABELS[s]}</Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  list: { padding: 16 },
  row: { flexDirection: 'row', alignItems: 'center', height: 36 },
  dot: { width: 14, height: 14, borderRadius: 7, backgroundColor: '#cbd5e1' },
  dotActive: { backgroundColor: '#16a34a' },
  line: {
    position: 'absolute',
    left: 6,
    top: 28,
    width: 2,
    height: 28,
    backgroundColor: '#e2e8f0',
  },
  lineActive: { backgroundColor: '#16a34a' },
  label: { marginLeft: 14, fontSize: 14, color: '#64748b' },
  labelActive: { color: '#0f172a', fontWeight: '500' },
  cancelled: { padding: 24, alignItems: 'center' },
  cancelText: { color: '#b91c1c', fontWeight: '600' },
});
