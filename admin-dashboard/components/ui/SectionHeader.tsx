import type { ReactNode } from 'react';

interface SectionHeaderProps {
  label: string;
  hint?: string;
  action?: ReactNode;
  className?: string;
}

export function SectionHeader({
  label,
  hint,
  action,
  className = '',
}: SectionHeaderProps) {
  return (
    <div className={`flex items-center justify-between mb-3 ${className}`}>
      <div>
        <p className="text-[11px] uppercase tracking-[0.16em] text-subtle font-semibold">
          {label}
        </p>
        {hint ? <p className="text-xs text-muted mt-0.5">{hint}</p> : null}
      </div>
      {action ? <div className="flex items-center gap-2">{action}</div> : null}
    </div>
  );
}

export default SectionHeader;
