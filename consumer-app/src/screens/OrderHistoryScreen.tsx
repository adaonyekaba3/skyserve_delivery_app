import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, SectionList, RefreshControl } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { getMyOrders } from '../services/api';
import { useOrders } from '../store/orders';
import {
  Screen,
  AppHeader,
  Card,
  Badge,
  statusToBadge,
  EmptyState,
  Skeleton,
  Icon,
} from '../ui';
import type { OrdersStackParamList } from '../navigation/RootNavigator';
import type { Order } from '../services/types';

type Props = NativeStackScreenProps<OrdersStackParamList, 'OrderHistory'>;

function formatDate(iso: string) {
  try {
    const d = new Date(iso);
    return d.toLocaleString('en-NG', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

function bucketFor(iso: string): 'Today' | 'Yesterday' | 'Earlier this week' | 'Earlier' {
  const created = new Date(iso);
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const dayMs = 24 * 60 * 60 * 1000;
  if (created >= startOfToday) return 'Today';
  if (created >= new Date(startOfToday.getTime() - dayMs)) return 'Yesterday';
  if (created >= new Date(startOfToday.getTime() - 6 * dayMs)) return 'Earlier this week';
  return 'Earlier';
}

const BUCKET_ORDER: Array<'Today' | 'Yesterday' | 'Earlier this week' | 'Earlier'> = [
  'Today',
  'Yesterday',
  'Earlier this week',
  'Earlier',
];

const TONE_DOT: Record<string, string> = {
  primary: '#0B1C2C',
  gold: '#C6A052',
  success: '#16A34A',
  warning: '#D97706',
  danger: '#DC2626',
  neutral: '#94A3B8',
};

function OrderSkeleton() {
  return (
    <Card className="mb-3">
      <Skeleton width="40%" height={14} className="mb-2" />
      <Skeleton width="80%" height={12} className="mb-2" />
      <Skeleton width="30%" height={16} />
    </Card>
  );
}

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

  const sections = useMemo(() => {
    const sortedOrders = [...orders].sort((a, b) =>
      a.createdAt < b.createdAt ? 1 : -1,
    );
    const groups = new Map<string, Order[]>();
    for (const o of sortedOrders) {
      const bucket = bucketFor(o.createdAt);
      const list = groups.get(bucket) ?? [];
      list.push(o);
      groups.set(bucket, list);
    }
    return BUCKET_ORDER.filter((b) => groups.has(b)).map((title) => ({
      title,
      data: groups.get(title) ?? [],
    }));
  }, [orders]);

  if (loading) {
    return (
      <Screen edges={['top', 'left', 'right']}>
        <AppHeader
          title="My orders"
          subtitle="Your past and active deliveries"
          variant="large"
        />
        <View className="px-5">
          <OrderSkeleton />
          <OrderSkeleton />
          <OrderSkeleton />
        </View>
      </Screen>
    );
  }

  return (
    <Screen edges={['top', 'left', 'right']}>
      <AppHeader
        title="My orders"
        subtitle="Your past and active deliveries"
        variant="large"
      />
      <SectionList
        sections={sections}
        keyExtractor={(o) => o.id}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 24 }}
        stickySectionHeadersEnabled={false}
        renderSectionHeader={({ section: { title } }) => (
          <Text
            className="text-subtle text-xs mb-2 mt-3"
            style={{ fontFamily: 'Inter_600SemiBold', letterSpacing: 1 }}
          >
            {title.toUpperCase()}
          </Text>
        )}
        renderItem={({ item }) => {
          const badge = statusToBadge(item.status);
          const dotColor = TONE_DOT[badge.tone] ?? TONE_DOT.neutral;
          return (
            <Card
              className="mb-3"
              onPress={() =>
                navigation.navigate('OrderTracking', { orderId: item.id })
              }
            >
              <View className="flex-row items-start justify-between">
                <View className="flex-1 pr-3">
                  <View className="flex-row items-center gap-2">
                    <View
                      className="rounded-full"
                      style={{
                        width: 8,
                        height: 8,
                        backgroundColor: dotColor,
                      }}
                    />
                    <Text
                      className="text-text text-base"
                      style={{ fontFamily: 'Inter_700Bold' }}
                    >
                      Order #{item.id.slice(0, 8)}
                    </Text>
                  </View>
                  <Text
                    className="text-muted text-xs mt-1.5 ml-4"
                    style={{ fontFamily: 'Inter_400Regular' }}
                    numberOfLines={1}
                  >
                    {item.deliveryAddress}
                  </Text>
                  <Text
                    className="text-subtle text-xs mt-1 ml-4"
                    style={{ fontFamily: 'Inter_400Regular' }}
                  >
                    {formatDate(item.createdAt)}
                  </Text>
                </View>
                <View className="items-end">
                  <Text
                    className="text-text text-base mb-2"
                    style={{ fontFamily: 'Inter_700Bold' }}
                  >
                    {`\u20A6${Number(item.totalAmount).toLocaleString()}`}
                  </Text>
                  <Badge label={badge.label} tone={badge.tone} size="sm" />
                </View>
              </View>
            </Card>
          );
        }}
        ListEmptyComponent={
          <EmptyState
            icon={<Icon name="file-text" size={26} color="#0B1C2C" />}
            title="No orders yet"
            description="Place your first order from the home tab."
          />
        }
        refreshControl={
          <RefreshControl
            tintColor="#0B1C2C"
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              load();
            }}
          />
        }
      />

      {error ? (
        <View className="bg-danger-soft rounded-md mx-5 mb-4 px-3 py-2.5 flex-row items-center gap-2">
          <Icon name="alert-triangle" size={14} color="#DC2626" />
          <Text className="text-danger text-sm flex-1" style={{ fontFamily: 'Inter_500Medium' }}>
            {error}
          </Text>
        </View>
      ) : null}
    </Screen>
  );
}
