import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { getOrder, patchOrderStatus } from '../services/api';
import { useFeed } from '../store/feed';
import type { OrderStatus } from '../services/types';
import {
  Screen,
  AppHeader,
  Card,
  Badge,
  statusToBadge,
  Button,
  Loader,
  EmptyState,
} from '../ui';
import type { OrdersStackParamList } from '../navigation/RootNavigator';

type Props = NativeStackScreenProps<OrdersStackParamList, 'OrderDetail'>;

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
  ACCEPTED: 'Accept order',
  PREPARING: 'Mark preparing',
  PICKED_UP: 'Mark ready for pickup',
  IN_FLIGHT: 'In flight',
  DELIVERED: 'Delivered',
  CANCELLED: 'Cancel order',
};

const STATUS_HEADLINE: Record<OrderStatus, string> = {
  PENDING: 'New order \u2014 awaiting acceptance',
  ACCEPTED: 'Accepted \u2014 start preparing',
  PREPARING: 'Preparing the meal',
  PICKED_UP: 'Ready for the drone',
  IN_FLIGHT: 'On its way',
  DELIVERED: 'Delivered',
  CANCELLED: 'Cancelled',
};

export default function OrderDetailScreen({ route, navigation }: Props) {
  const { orderId } = route.params;
  const order = useFeed((s) => s.byId[orderId]);
  const upsert = useFeed((s) => s.upsert);
  const [loading, setLoading] = useState(!order);
  const [busy, setBusy] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<OrderStatus | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    getOrder(orderId)
      .then((o) => {
        if (active) {
          upsert(o);
          setLoading(false);
        }
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
  }, [orderId, upsert]);

  const transition = async (next: OrderStatus) => {
    setBusy(true);
    setPendingStatus(next);
    setError(null);
    try {
      const updated = await patchOrderStatus(orderId, next);
      upsert(updated);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
      setPendingStatus(null);
    }
  };

  if (loading) {
    return (
      <Screen>
        <AppHeader title="Order detail" showBack />
        <Loader fullscreen label="Loading order..." />
      </Screen>
    );
  }

  if (!order) {
    return (
      <Screen>
        <AppHeader title="Order detail" showBack />
        <EmptyState
          icon={'\u26A0\uFE0F'}
          title="Order not found"
          description={error ?? 'We could not load this order.'}
          ctaLabel="Back"
          onCta={() => navigation.canGoBack() && navigation.goBack()}
        />
      </Screen>
    );
  }

  const status = order.status as OrderStatus;
  const badge = statusToBadge(status);
  const next = ALLOWED_NEXT[status] ?? [];

  return (
    <Screen edges={['top', 'left', 'right']}>
      <AppHeader title={`#${order.id.slice(0, 8)}`} subtitle={STATUS_HEADLINE[status]} showBack />
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
      >
        <Card padding="lg" className="mb-4 bg-primary border-primary">
          <Badge label={badge.label} tone="gold" />
          <Text
            className="text-white text-2xl mt-2"
            style={{ fontFamily: 'Inter_700Bold' }}
          >
            {STATUS_HEADLINE[status]}
          </Text>
          <Text
            className="text-white/80 text-sm mt-1"
            style={{ fontFamily: 'Inter_400Regular' }}
          >
            Total {'\u20A6'}{Number(order.totalAmount).toLocaleString()}
          </Text>
        </Card>

        <Card className="mb-4">
          <Text
            className="text-text text-base mb-2"
            style={{ fontFamily: 'Inter_600SemiBold' }}
          >
            Delivery address
          </Text>
          <Text
            className="text-muted text-sm"
            style={{ fontFamily: 'Inter_400Regular' }}
          >
            {order.deliveryAddress}
          </Text>
        </Card>

        {order.items?.length ? (
          <Card className="mb-4">
            <Text
              className="text-text text-base mb-3"
              style={{ fontFamily: 'Inter_600SemiBold' }}
            >
              Items
            </Text>
            {order.items.map((item) => (
              <View key={item.id} className="flex-row justify-between py-1.5">
                <Text
                  className="text-text text-sm flex-1 pr-2"
                  style={{ fontFamily: 'Inter_500Medium' }}
                  numberOfLines={1}
                >
                  {item.nameSnapshot} \u00D7 {item.quantity}
                </Text>
                <Text
                  className="text-muted text-sm"
                  style={{ fontFamily: 'Inter_500Medium' }}
                >
                  {'\u20A6'}{(Number(item.unitPrice) * item.quantity).toLocaleString()}
                </Text>
              </View>
            ))}
          </Card>
        ) : null}

        <Card className="mb-4">
          <Text
            className="text-text text-base mb-3"
            style={{ fontFamily: 'Inter_600SemiBold' }}
          >
            Update status
          </Text>
          {next.length === 0 ? (
            <Text
              className="text-muted text-sm"
              style={{ fontFamily: 'Inter_400Regular' }}
            >
              No further actions for orders in this state.
            </Text>
          ) : (
            <View className="gap-2">
              {next.map((s) => (
                <Button
                  key={s}
                  label={LABELS[s]}
                  onPress={() => transition(s)}
                  variant={s === 'CANCELLED' ? 'danger' : 'primary'}
                  loading={busy && pendingStatus === s}
                  disabled={busy && pendingStatus !== s}
                  fullWidth
                />
              ))}
            </View>
          )}
        </Card>

        {error ? (
          <View className="bg-danger-soft rounded-md mt-2 px-3 py-2.5">
            <Text className="text-danger text-sm" style={{ fontFamily: 'Inter_500Medium' }}>
              {error}
            </Text>
          </View>
        ) : null}
      </ScrollView>
    </Screen>
  );
}
