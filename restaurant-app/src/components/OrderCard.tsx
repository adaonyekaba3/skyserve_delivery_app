import React from 'react';
import { Text, View } from 'react-native';
import type { Order } from '../services/types';
import { Card, Badge, statusToBadge } from '../ui';

interface Props {
  order: Order;
  onPress: () => void;
}

function ageMinutes(iso: string): number {
  const ts = new Date(iso).getTime();
  if (Number.isNaN(ts)) return 0;
  return Math.max(0, Math.round((Date.now() - ts) / 60000));
}

export default function OrderCard({ order, onPress }: Props) {
  const badge = statusToBadge(order.status);
  const age = ageMinutes(order.createdAt);
  const itemCount = order.items?.length ?? 0;

  return (
    <Card className="mb-3" onPress={onPress}>
      <View className="flex-row items-start justify-between">
        <View className="flex-1 pr-3">
          <View className="flex-row items-center mb-1">
            <Text
              className="text-text text-base"
              style={{ fontFamily: 'Inter_700Bold' }}
            >
              #{order.id.slice(0, 8)}
            </Text>
            <Text
              className="text-subtle text-xs ml-2"
              style={{ fontFamily: 'Inter_500Medium' }}
            >
              {age === 0 ? 'just now' : `${age}m ago`}
            </Text>
          </View>
          <Text
            className="text-muted text-xs"
            style={{ fontFamily: 'Inter_400Regular' }}
            numberOfLines={1}
          >
            {order.deliveryAddress}
          </Text>
          {itemCount > 0 ? (
            <Text
              className="text-subtle text-xs mt-1"
              style={{ fontFamily: 'Inter_400Regular' }}
            >
              {itemCount} item{itemCount > 1 ? 's' : ''}
            </Text>
          ) : null}
        </View>
        <View className="items-end">
          <Text
            className="text-text text-base mb-2"
            style={{ fontFamily: 'Inter_700Bold' }}
          >
            {'\u20A6'}
            {Number(order.totalAmount).toLocaleString()}
          </Text>
          <Badge label={badge.label} tone={badge.tone} size="sm" />
        </View>
      </View>
    </Card>
  );
}
