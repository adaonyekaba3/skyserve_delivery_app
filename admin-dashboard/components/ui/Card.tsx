import { type ReactNode } from 'react';

type Padding = 'none' | 'sm' | 'md' | 'lg';

const padClass: Record<Padding, string> = {
  none: '',
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-6',
};

interface CardProps {
  children: ReactNode;
  className?: string;
  padding?: Padding;
  elevated?: boolean;
}

export function Card({
  children,
  className = '',
  padding = 'md',
  elevated = true,
}: CardProps) {
  const base = `bg-surface rounded-lg border border-border ${padClass[padding]} ${
    elevated ? 'shadow-card' : ''
  } ${className}`;
  return <div className={base}>{children}</div>;
}

export default Card;
