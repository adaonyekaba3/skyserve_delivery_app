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
import { useAuth } from '@clerk/clerk-expo';
import { getMe, getRestaurantOrders } from '../services/api';
import { subscribe, unsubscribe } from '../services/realtime';
import { useFeed } from '../store/feed';
import type { Order } from '../services/types';
import OrderCard from '../components/OrderCard';
import type { RootStackParamList } from '../navigation/RootNavigator';
import { notifyOps } from '../services/notifications';

type Props = NativeStackScreenProps<RootStackParamList, 'OrdersFeed'>;

export default function OrdersFeedScreen({ navigation }: Props) {
  const { signOut } = useAuth();
  const orders = useFeed((s) => Object.values(s.byId));
  const setMany = useFeed((s) => s.setMany);
  const upsert = useFeed((s) => s.upsert);
  const [restaurantId, setRestaurantId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    async (rid: string) => {
      setError(null);
      try {
        const data = await getRestaurantOrders(rid);
        setMany(data);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [setMany],
  );

  useEffect(() => {
    let active = true;
    getMe()
      .then((me) => {
        if (!active) return;
        const rid = me.restaurantIds[0];
        if (!rid) {
          setError('No restaurant linked to this account.');
          setLoading(false);
          return;
        }
        setRestaurantId(rid);
        load(rid);
      })
      .catch((err) => {
        if (active) {
          setError((err as Error).message);
          setLoading(false);
        }
      });
    return () => {
      active = false;
    };
  }, [load]);

  useEffect(() => {
    if (!restaurantId) return undefined;
    const channelName = `private-restaurant-${restaurantId}`;
    const channel = subscribe(channelName);
    if (!channel) return undefined;
    const handler = (payload: Order) => {
      upsert(payload);
      void notifyOps('Restaurant order update', `Order #${payload.id.slice(0, 8)} is ${payload.status}`);
    };
    channel.bind('order_created', handler);
    channel.bind('order_status_updated', handler);
    return () => {
      channel.unbind('order_created', handler);
      channel.unbind('order_status_updated', handler);
      unsubscribe(channelName);
    };
  }, [restaurantId, upsert]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Orders</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={() => navigation.navigate('RestaurantManage')}>
            <Text style={styles.headerLink}>Manage</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => signOut()}>
            <Text style={styles.headerLink}>Sign out</Text>
          </TouchableOpacity>
        </View>
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <FlatList
        data={[...orders].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))}
        keyExtractor={(o) => o.id}
        contentContainerStyle={{ padding: 16 }}
        renderItem={({ item }) => (
          <OrderCard
            order={item}
            onPress={() => navigation.navigate('OrderDetail', { orderId: item.id })}
          />
        )}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              if (!restaurantId) return;
              setRefreshing(true);
              load(restaurantId);
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  headerActions: { flexDirection: 'row', gap: 14 },
  title: { fontSize: 24, fontWeight: '700', color: '#0f172a' },
  headerLink: { color: '#64748b' },
  error: { color: '#b91c1c', textAlign: 'center', padding: 12 },
  empty: { textAlign: 'center', color: '#64748b', marginTop: 40 },
});
