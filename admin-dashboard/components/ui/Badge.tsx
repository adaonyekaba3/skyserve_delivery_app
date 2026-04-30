import type { ReactNode } from 'react';
import type { OrderStatus } from '@/lib/types';

export type BadgeTone =
  | 'neutral'
  | 'primary'
  | 'success'
  | 'warning'
  | 'danger'
  | 'gold';
type Size = 'sm' | 'md';

const toneBg: Record<BadgeTone, string> = {
  neutral: 'bg-hairline',
  primary: 'bg-primary-soft',
  success: 'bg-success-soft',
  warning: 'bg-warning-soft',
  danger: 'bg-danger-soft',
  gold: 'bg-accent-soft',
};

const toneText: Record<BadgeTone, string> = {
  neutral: 'text-muted',
  primary: 'text-primary',
  success: 'text-success',
  warning: 'text-warning',
  danger: 'text-danger',
  gold: 'text-accent',
};

interface BadgeProps {
  label: string;
  tone?: BadgeTone;
  size?: Size;
  icon?: ReactNode;
  className?: string;
}

export function Badge({
  label,
  tone = 'neutral',
  size = 'md',
  icon,
  className = '',
}: BadgeProps) {
  const padClass = size === 'sm' ? 'px-2 py-0.5' : 'px-2.5 py-1';
  const textSize = size === 'sm' ? 'text-[11px]' : 'text-xs';
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full font-semibold ${toneBg[tone]} ${toneText[tone]} ${padClass} ${textSize} ${className}`}
    >
      {icon ? <span className="inline-flex items-center">{icon}</span> : null}
      {label}
    </span>
  );
}

const TONE_DOT: Record<BadgeTone, string> = {
  neutral: '#94A3B8',
  primary: '#0B1C2C',
  success: '#16A34A',
  warning: '#D97706',
  danger: '#DC2626',
  gold: '#C6A052',
};

export function dotColorFor(tone: BadgeTone): string {
  return TONE_DOT[tone];
}

export function statusToBadge(status: OrderStatus): {
  label: string;
  tone: BadgeTone;
} {
  switch (status) {
    case 'PENDING':
      return { label: 'Pending', tone: 'warning' };
    case 'ACCEPTED':
      return { label: 'Accepted', tone: 'primary' };
    case 'PREPARING':
      return { label: 'Processing', tone: 'primary' };
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
