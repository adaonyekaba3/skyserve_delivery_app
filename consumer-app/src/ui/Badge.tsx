import React from 'react';
import { View, Text } from 'react-native';
import type { OrderStatus } from '../services/types';

type Tone = 'neutral' | 'primary' | 'success' | 'warning' | 'danger' | 'gold';

interface BadgeProps {
  label: string;
  tone?: Tone;
  size?: 'sm' | 'md';
  className?: string;
}

const toneBg: Record<Tone, string> = {
  neutral: 'bg-hairline',
  primary: 'bg-primary-soft',
  success: 'bg-success-soft',
  warning: 'bg-warning-soft',
  danger: 'bg-danger-soft',
  gold: 'bg-accent-soft',
};

const toneText: Record<Tone, string> = {
  neutral: 'text-muted',
  primary: 'text-primary',
  success: 'text-success',
  warning: 'text-warning',
  danger: 'text-danger',
  gold: 'text-accent',
};

export function Badge({
  label,
  tone = 'neutral',
  size = 'md',
  className = '',
}: BadgeProps) {
  const padClass = size === 'sm' ? 'px-2 py-0.5' : 'px-2.5 py-1';
  const textSize = size === 'sm' ? 'text-[11px]' : 'text-xs';

  return (
    <View
      className={`${toneBg[tone]} ${padClass} rounded-full self-start ${className}`}
    >
      <Text
        className={`${toneText[tone]} ${textSize} font-semi`}
        style={{ fontFamily: 'Inter_600SemiBold' }}
      >
        {label}
      </Text>
    </View>
  );
}

export function statusToBadge(status: OrderStatus): {
  label: string;
  tone: Tone;
} {
  switch (status) {
    case 'PENDING':
      return { label: 'Pending', tone: 'warning' };
    case 'ACCEPTED':
      return { label: 'Accepted', tone: 'primary' };
    case 'PREPARING':
      return { label: 'Preparing', tone: 'primary' };
    case 'PICKED_UP':
      return { label: 'Picked up', tone: 'gold' };
    case 'IN_FLIGHT':
      return { label: 'In flight', tone: 'gold' };
    case 'DELIVERED':
      return { label: 'Delivered', tone: 'success' };
    case 'CANCELLED':
      return { label: 'Cancelled', tone: 'danger' };
    default:
      return { label: String(status), tone: 'neutral' };
  }
}

export default Badge;
