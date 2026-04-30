import React from 'react';
import { View, Pressable } from 'react-native';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  onPress?: () => void;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  elevated?: boolean;
}

const padClass: Record<NonNullable<CardProps['padding']>, string> = {
  none: '',
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-5',
};

export function Card({
  children,
  className = '',
  onPress,
  padding = 'md',
  elevated = true,
}: CardProps) {
  const base = `bg-surface rounded-lg border border-border ${padClass[padding]} ${
    elevated ? 'shadow-sm' : ''
  } ${className}`;

  if (onPress) {
    return (
      <Pressable onPress={onPress} className={`${base} active:opacity-80`}>
        {children}
      </Pressable>
    );
  }

  return <View className={base}>{children}</View>;
}

export default Card;
