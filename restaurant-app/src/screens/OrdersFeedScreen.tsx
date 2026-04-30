import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, FlatList, RefreshControl, ScrollView } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { getMe, getRestaurantOrders } from '../services/api';
import { subscribe, unsubscribe } from '../services/realtime';
import { useFeed } from '../store/feed';
import type { Order, OrderStatus } from '../services/types';
import OrderCard from '../components/OrderCard';
import {
  Screen,
  AppHeader,
  CategoryPill,
  EmptyState,
  Card,
  Skeleton,
} from '../ui';
import type { OrdersStackParamList } from '../navigation/RootNavigator';
import { notifyOps } from '../services/notifications';

type Props = NativeStackScreenProps<OrdersStackParamList, 'OrdersFeed'>;

const FILTERS: Array<{ id: 'ALL' | OrderStatus; label: string }> = [
  { id: 'ALL', label: 'All' },
  { id: 'PENDING', label: 'Pending' },
  { id: 'ACCEPTED', label: 'Accepted' },
  { id: 'PREPARING', label: 'Preparing' },
  { id: 'PICKED_UP', label: 'Picked up' },
];

function FeedSkeleton() {
  return (
    <Card className="mb-3">
      <Skeleton width="40%" height={14} className="mb-2" />
      <Skeleton width="80%" height={12} className="mb-2" />
      <Skeleton width="30%" height={16} />
    </Card>
  );
}

export default function OrdersFeedScreen({ navigation }: Props) {
  const orders = useFeed((s) => Object.values(s.byId));
  const setMany = useFeed((s) => s.setMany);
  const upsert = useFeed((s) => s.upsert);
  const [restaurantId, setRestaurantId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'ALL' | OrderStatus>('ALL');

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
      void notifyOps(
        'Restaurant order update',
        `Order #${payload.id.slice(0, 8)} is ${payload.status}`,
      );
    };
    channel.bind('order_created', handler);
    channel.bind('order_status_updated', handler);
    return () => {
      channel.unbind('order_created', handler);
      channel.unbind('order_status_updated', handler);
      unsubscribe(channelName);
    };
  }, [restaurantId, upsert]);

  const sorted = useMemo(
    () =>
      [...orders]
        .filter((o) => filter === 'ALL' || o.status === filter)
        .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1)),
    [orders, filter],
  );

  return (
    <Screen edges={['top', 'left', 'right']}>
      <AppHeader
        title="Orders"
        subtitle="Live restaurant feed"
        variant="large"
      />

      <View className="px-5 pb-3">
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingRight: 4 }}
        >
          {FILTERS.map((f) => (
            <CategoryPill
              key={f.id}
              label={f.label}
              active={filter === f.id}
              onPress={() => setFilter(f.id)}
            />
          ))}
        </ScrollView>
      </View>

      {loading ? (
        <View className="px-5">
          <FeedSkeleton />
          <FeedSkeleton />
          <FeedSkeleton />
        </View>
      ) : (
        <FlatList
          data={sorted}
          keyExtractor={(o) => o.id}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 24 }}
          renderItem={({ item }) => (
            <OrderCard
              order={item}
              onPress={() =>
                navigation.navigate('OrderDetail', { orderId: item.id })
              }
            />
          )}
          refreshControl={
            <RefreshControl
              tintColor="#1E3A8A"
              refreshing={refreshing}
              onRefresh={() => {
                if (!restaurantId) return;
                setRefreshing(true);
                load(restaurantId);
              }}
            />
          }
          ListEmptyComponent={
            <EmptyState
              icon={'\uD83D\uDCED'}
              title="No orders yet"
              description="Incoming orders will appear here in real time."
            />
          }
        />
      )}

      {error ? (
        <View className="bg-danger-soft rounded-md mx-5 mb-4 px-3 py-2.5">
          <Text
            className="text-danger text-sm"
            style={{ fontFamily: 'Inter_500Medium' }}
          >
            {error}
          </Text>
        </View>
      ) : null}
    </Screen>
  );
}
