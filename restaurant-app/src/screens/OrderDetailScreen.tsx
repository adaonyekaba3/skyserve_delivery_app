import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { getOrder, patchOrderStatus } from '../services/api';
import { useFeed } from '../store/feed';
import type { Order, OrderStatus } from '../services/types';
import type { RootStackParamList } from '../navigation/RootNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'OrderDetail'>;

const ALLOWED_NEXT: Record<OrderStatus, OrderStatus[]> = {
  PENDING: ['ACCEPTED', 'CANCELLED'],
  ACCEPTED: ['PREPARING', 'CANCELLED'],
  PREPARING: ['PICKED_UP', 'CANCELLED'],
  PICKED_UP: [],
  IN_FLIGHT: [],
  DELIVERED: [],
  CANCELLED: [],
};

const LABELS: Record<OrderStatus, string> = {
  PENDING: 'Pending',
  ACCEPTED: 'Accept',
  PREPARING: 'Mark preparing',
  PICKED_UP: 'Mark ready for pickup',
  IN_FLIGHT: 'In flight',
  DELIVERED: 'Delivered',
  CANCELLED: 'Cancel',
};

export default function OrderDetailScreen({ route }: Props) {
  const { orderId } = route.params;
  const order = useFeed((s) => s.byId[orderId]);
  const upsert = useFeed((s) => s.upsert);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    getOrder(orderId)
      .then((o) => active && upsert(o))
      .catch((err) => active && setError((err as Error).message));
    return () => {
      active = false;
    };
  }, [orderId, upsert]);

  const transition = async (next: OrderStatus) => {
    setBusy(true);
    setError(null);
    try {
      const updated = await patchOrderStatus(orderId, next);
      upsert(updated);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  if (!order) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
      </View>
    );
  }

  const next = ALLOWED_NEXT[order.status as OrderStatus] ?? [];

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 16 }}>
      <Text style={styles.title}>Order #{order.id.slice(0, 8)}</Text>
      <Text style={styles.label}>Status: {order.status}</Text>
      <Text style={styles.label}>Address: {order.deliveryAddress}</Text>
      <Text style={styles.label}>Total: ₦{Number(order.totalAmount).toLocaleString()}</Text>

      {order.items?.length ? (
        <View style={styles.itemsBox}>
          <Text style={styles.itemsTitle}>Items</Text>
          {order.items.map((item) => (
            <View key={item.id} style={styles.itemRow}>
              <Text style={styles.itemName}>
                {item.nameSnapshot} × {item.quantity}
              </Text>
              <Text style={styles.itemPrice}>
                ₦{(Number(item.unitPrice) * item.quantity).toLocaleString()}
              </Text>
            </View>
          ))}
        </View>
      ) : null}

      <View style={styles.actions}>
        {next.length === 0 ? (
          <Text style={styles.empty}>No further actions available.</Text>
        ) : (
          next.map((status) => (
            <TouchableOpacity
              key={status}
              onPress={() => transition(status)}
              style={[
                styles.actionBtn,
                status === 'CANCELLED' ? styles.cancelBtn : styles.primaryBtn,
              ]}
              disabled={busy}
            >
              <Text style={styles.actionText}>{LABELS[status]}</Text>
            </TouchableOpacity>
          ))
        )}
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 22, fontWeight: '700', color: '#0f172a' },
  label: { color: '#475569', marginTop: 8 },
  itemsBox: {
    marginTop: 16,
    padding: 12,
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
  },
  itemsTitle: { fontWeight: '600', color: '#0f172a', marginBottom: 6 },
  itemRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  itemName: { color: '#0f172a' },
  itemPrice: { color: '#475569' },
  actions: { marginTop: 24 },
  actionBtn: { paddingVertical: 14, borderRadius: 8, alignItems: 'center', marginBottom: 12 },
  primaryBtn: { backgroundColor: '#0f172a' },
  cancelBtn: { backgroundColor: '#fee2e2' },
  actionText: { color: '#fff', fontWeight: '600' },
  empty: { color: '#64748b' },
  error: { color: '#b91c1c', marginTop: 16 },
});
