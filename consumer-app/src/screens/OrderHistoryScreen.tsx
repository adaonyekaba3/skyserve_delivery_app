import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { getMyOrders } from '../services/api';
import type { Order } from '../services/types';
import { useOrders } from '../store/orders';
import type { RootStackParamList } from '../navigation/RootNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'OrderHistory'>;

export default function OrderHistoryScreen({ navigation }: Props) {
  const orders = useOrders((s) => Object.values(s.byId));
  const setMany = useOrders((s) => s.setMany);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const data = await getMyOrders();
      setMany(data);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [setMany]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <FlatList
        data={[...orders].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))}
        keyExtractor={(o) => o.id}
        contentContainerStyle={{ padding: 16 }}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.row}
            onPress={() => navigation.navigate('OrderTracking', { orderId: item.id })}
          >
            <View style={{ flex: 1 }}>
              <Text style={styles.id}>#{item.id.slice(0, 8)}</Text>
              <Text style={styles.address}>{item.deliveryAddress}</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={styles.amount}>₦{Number(item.totalAmount).toLocaleString()}</Text>
              <Text style={styles.status}>{item.status}</Text>
            </View>
          </TouchableOpacity>
        )}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              load();
            }}
          />
        }
        ListEmptyComponent={<Text style={styles.empty}>No orders yet.</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  row: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  id: { fontWeight: '600', color: '#0f172a' },
  address: { color: '#64748b', marginTop: 4 },
  amount: { fontWeight: '600', color: '#0f172a' },
  status: { color: '#475569', marginTop: 4, fontSize: 12 },
  error: { color: '#b91c1c', textAlign: 'center', padding: 12 },
  empty: { textAlign: 'center', color: '#64748b', marginTop: 40 },
});
