import React from 'react';
import { View, Text } from 'react-native';
import { Button } from './Button';

interface EmptyStateProps {
  icon?: React.ReactNode | string;
  title: string;
  description?: string;
  ctaLabel?: string;
  onCta?: () => void;
  secondaryCtaLabel?: string;
  onSecondaryCta?: () => void;
  className?: string;
}

export function EmptyState({
  icon = '\uD83D\uDCED',
  title,
  description,
  ctaLabel,
  onCta,
  secondaryCtaLabel,
  onSecondaryCta,
  className = '',
}: EmptyStateProps) {
  return (
    <View className={`flex-1 items-center justify-center px-8 py-12 ${className}`}>
      <View className="h-16 w-16 rounded-full bg-accent-soft items-center justify-center mb-4">
        {typeof icon === 'string' ? (
          <Text className="text-3xl">{icon}</Text>
        ) : (
          icon
        )}
      </View>
      <Text
        className="text-text text-lg font-bold text-center"
        style={{ fontFamily: 'Inter_700Bold' }}
      >
        {title}
      </Text>
      {description ? (
        <Text
          className="text-muted text-sm text-center mt-2 leading-5"
          style={{ fontFamily: 'Inter_400Regular' }}
        >
          {description}
        </Text>
      ) : null}
      {ctaLabel && onCta ? (
        <View className="mt-6 w-full max-w-[260px]">
          <Button label={ctaLabel} onPress={onCta} variant="primary" fullWidth />
        </View>
      ) : null}
      {secondaryCtaLabel && onSecondaryCta ? (
        <View className="mt-2 w-full max-w-[260px]">
          <Button
            label={secondaryCtaLabel}
            onPress={onSecondaryCta}
            variant="ghost"
            fullWidth
          />
        </View>
      ) : null}
    </View>
  );
}

export default EmptyState;
