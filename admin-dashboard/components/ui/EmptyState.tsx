import type { ReactNode } from 'react';
import { Button } from './Button';

interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  description?: string;
  ctaLabel?: string;
  onCta?: () => void;
}

export function EmptyState({
  icon,
  title,
  description,
  ctaLabel,
  onCta,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center px-8 py-12 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-accent-soft">
        {icon}
      </div>
      <h3 className="mt-4 text-lg font-bold text-text">{title}</h3>
      {description ? (
        <p className="mt-2 max-w-sm text-sm leading-5 text-muted">
          {description}
        </p>
      ) : null}
      {ctaLabel && onCta ? (
        <div className="mt-5">
          <Button label={ctaLabel} onClick={onCta} />
        </div>
      ) : null}
    </div>
  );
}

export default EmptyState;
