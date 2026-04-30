import React from 'react';
import { View, Text } from 'react-native';

interface ProgressIndicatorProps {
  step: number;
  total: number;
  labels?: string[];
}

export function ProgressIndicator({
  step,
  total,
  labels,
}: ProgressIndicatorProps) {
  return (
    <View className="px-5 pt-1 pb-2">
      <View className="flex-row items-center gap-1.5">
        {Array.from({ length: total }).map((_, i) => {
          const reached = i < step;
          const current = i === step - 1;
          return (
            <View
              key={i}
              className="flex-1 rounded-full"
              style={{
                height: 4,
                backgroundColor: reached
                  ? '#C6A052'
                  : current
                    ? '#0B1C2C'
                    : '#E5E7EB',
                opacity: reached ? 1 : current ? 0.85 : 1,
              }}
            />
          );
        })}
      </View>
      <Text
        className="text-muted text-xs mt-2"
        style={{ fontFamily: 'Inter_500Medium' }}
      >
        {`Step ${step} of ${total}${labels && labels[step - 1] ? ` - ${labels[step - 1]}` : ''}`}
      </Text>
    </View>
  );
}

export default ProgressIndicator;
