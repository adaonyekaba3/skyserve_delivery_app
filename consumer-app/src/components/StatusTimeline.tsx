import React from 'react';
import { Text, View } from 'react-native';
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
      <View className="bg-danger-soft rounded-md p-4 items-center">
        <Text
          className="text-danger text-base"
          style={{ fontFamily: 'Inter_600SemiBold' }}
        >
          Order cancelled
        </Text>
      </View>
    );
  }

  const currentIndex = STAGES.indexOf(status);

  return (
    <View>
      {STAGES.map((s, i) => {
        const reached = i <= currentIndex;
        const isCurrent = i === currentIndex;
        const isLast = i === STAGES.length - 1;

        return (
          <View key={s} className="flex-row" style={{ minHeight: 48 }}>
            <View className="items-center mr-3" style={{ width: 24 }}>
              <View
                className={`h-5 w-5 rounded-full items-center justify-center ${
                  reached ? 'bg-accent' : 'bg-hairline'
                }`}
              >
                {reached ? (
                  <View className="h-2 w-2 rounded-full bg-white" />
                ) : null}
              </View>
              {!isLast ? (
                <View
                  className={`flex-1 w-0.5 my-0.5 ${
                    i < currentIndex ? 'bg-accent' : 'bg-hairline'
                  }`}
                />
              ) : null}
            </View>
            <View className="flex-1 pb-2">
              <Text
                className={`text-sm ${
                  isCurrent
                    ? 'text-primary'
                    : reached
                      ? 'text-text'
                      : 'text-subtle'
                }`}
                style={{
                  fontFamily: isCurrent
                    ? 'Inter_700Bold'
                    : reached
                      ? 'Inter_600SemiBold'
                      : 'Inter_500Medium',
                }}
              >
                {LABELS[s]}
              </Text>
              {isCurrent ? (
                <Text
                  className="text-muted text-xs mt-0.5"
                  style={{ fontFamily: 'Inter_400Regular' }}
                >
                  In progress
                </Text>
              ) : null}
            </View>
          </View>
        );
      })}
    </View>
  );
}
