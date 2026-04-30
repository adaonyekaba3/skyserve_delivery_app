import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

type Tone = 'default' | 'navy' | 'gold' | 'success' | 'warning' | 'danger';

const accentColor: Record<Tone, string> = {
  default: '#C6A052',
  navy: '#FFFFFF',
  gold: '#0B1C2C',
  success: '#16A34A',
  warning: '#D97706',
  danger: '#DC2626',
};

const containerClass: Record<Tone, string> = {
  default: 'bg-surface border border-border shadow-card',
  navy: 'bg-primary border border-primary shadow-navy text-white',
  gold: 'bg-accent border border-accent text-text shadow-card',
  success: 'bg-surface border border-border shadow-card',
  warning: 'bg-surface border border-warning/40 shadow-card',
  danger: 'bg-surface border border-danger/40 shadow-card',
};

const labelClass: Record<Tone, string> = {
  default: 'text-subtle',
  navy: 'text-white/70',
  gold: 'text-text/70',
  success: 'text-subtle',
  warning: 'text-warning',
  danger: 'text-danger',
};

const valueClass: Record<Tone, string> = {
  default: 'text-text',
  navy: 'text-white',
  gold: 'text-text',
  success: 'text-text',
  warning: 'text-text',
  danger: 'text-text',
};

const subClass: Record<Tone, string> = {
  default: 'text-muted',
  navy: 'text-white/60',
  gold: 'text-text/70',
  success: 'text-muted',
  warning: 'text-muted',
  danger: 'text-muted',
};

interface MetricCardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  sub?: string;
  tone?: Tone;
  trailing?: ReactNode;
}

export function MetricCard({
  icon: Icon,
  label,
  value,
  sub,
  tone = 'default',
  trailing,
}: MetricCardProps) {
  return (
    <div className={`rounded-lg p-5 ${containerClass[tone]}`}>
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Icon size={14} color={accentColor[tone]} />
            <span
              className={`text-[11px] uppercase tracking-[0.16em] font-semibold ${labelClass[tone]}`}
            >
              {label}
            </span>
          </div>
          <p className={`mt-2 text-2xl font-bold ${valueClass[tone]}`}>
            {value}
          </p>
          {sub ? (
            <p className={`mt-1 text-xs ${subClass[tone]}`}>{sub}</p>
          ) : null}
        </div>
        {trailing ? <div className="ml-3 shrink-0">{trailing}</div> : null}
      </div>
    </div>
  );
}

export default MetricCard;
