import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';

interface PageHeroProps {
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  trailing?: ReactNode;
}

export function PageHero({
  title,
  subtitle,
  icon: Icon,
  trailing,
}: PageHeroProps) {
  return (
    <div className="rounded-lg bg-primary px-6 py-5 text-white shadow-navy">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          {Icon ? (
            <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/10">
              <Icon size={16} color="#C6A052" />
            </div>
          ) : null}
          <div>
            <h1 className="text-xl font-bold leading-tight">{title}</h1>
            {subtitle ? (
              <p className="mt-1 text-sm text-white/70">{subtitle}</p>
            ) : null}
          </div>
        </div>
        {trailing ? <div className="shrink-0">{trailing}</div> : null}
      </div>
    </div>
  );
}

export default PageHero;
