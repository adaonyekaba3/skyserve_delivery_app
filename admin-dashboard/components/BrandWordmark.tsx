import { Crown } from 'lucide-react';
import { BRAND_NAME, BRAND_TAGLINE } from '../lib/brand';

type Variant = 'compact' | 'splash';

interface BrandWordmarkProps {
  variant?: Variant;
  subtitle?: string;
}

/**
 * Queen Operations wordmark — hairline crown glyph in gold accent next to
 * the Queen mark, with the "by Atelier Élevé" tagline tracked in caps.
 */
export function BrandWordmark({ variant = 'compact', subtitle }: BrandWordmarkProps) {
  if (variant === 'splash') {
    return (
      <div className="flex flex-col items-center gap-2.5">
        <Crown
          aria-hidden
          className="h-9 w-9 text-accent"
          strokeWidth={1.5}
        />
        <h1 className="text-3xl font-bold tracking-tight text-text">
          {BRAND_NAME}
        </h1>
        <p className="text-[11px] uppercase tracking-[0.22em] text-muted">
          {BRAND_TAGLINE}
        </p>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Crown
        aria-hidden
        className="h-5 w-5 text-accent"
        strokeWidth={1.5}
      />
      <div className="leading-tight">
        <h1 className="text-lg font-bold tracking-tight text-text">
          {BRAND_NAME}
        </h1>
        <p className="text-[9px] uppercase tracking-[0.18em] text-muted">
          {subtitle ?? BRAND_TAGLINE}
        </p>
      </div>
    </div>
  );
}

export default BrandWordmark;
