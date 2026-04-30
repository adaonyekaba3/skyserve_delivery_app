'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { UserButton } from '@clerk/nextjs';
import {
  LayoutDashboard,
  Inbox,
  Plane,
  Map as MapIcon,
  Store,
  TrendingUp,
  type LucideIcon,
  Activity,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useAdminBus } from '@/lib/useAdminBus';
import { fetchAdminOverview } from '@/lib/api.client';

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

const NAV: NavItem[] = [
  { href: '/overview', label: 'Overview', icon: LayoutDashboard },
  { href: '/orders', label: 'Orders', icon: Inbox },
  { href: '/vendors', label: 'Vendors', icon: Store },
  { href: '/fleet', label: 'Fleet', icon: Plane },
  { href: '/map', label: 'Live Map', icon: MapIcon },
  { href: '/insights', label: 'Insights', icon: TrendingUp },
];

export default function DashboardShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [unprocessed, setUnprocessed] = useState<number | null>(null);

  const refreshUnprocessed = async () => {
    try {
      const data = await fetchAdminOverview();
      setUnprocessed(data.unprocessedCount ?? 0);
    } catch {
      setUnprocessed(null);
    }
  };

  useEffect(() => {
    refreshUnprocessed();
    const i = setInterval(refreshUnprocessed, 30_000);
    return () => clearInterval(i);
  }, []);

  useAdminBus({
    onOrderChanged: () => {
      refreshUnprocessed();
    },
  });

  return (
    <div className="min-h-screen bg-bg">
      <header className="border-b border-border bg-surface">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
              <span className="text-lg font-bold text-accent">S</span>
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-text">
                Skyrunner Ops
              </h1>
              <p className="text-xs text-muted">
                Realtime drone delivery control
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {typeof unprocessed === 'number' && unprocessed > 0 ? (
              <Link
                href="/orders"
                className="hidden md:inline-flex items-center gap-1.5 rounded-full bg-warning-soft px-3 py-1 text-xs font-semibold text-warning hover:bg-warning-soft/80"
              >
                <Activity size={12} />
                {unprocessed} unprocessed
              </Link>
            ) : (
              <span className="hidden md:inline-flex items-center gap-1.5 rounded-full bg-success-soft px-3 py-1 text-xs font-semibold text-success">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-success" />
                All systems nominal
              </span>
            )}
            <UserButton afterSignOutUrl="/sign-in" />
          </div>
        </div>
      </header>
      <div className="mx-auto grid max-w-7xl grid-cols-12 gap-6 px-6 py-6">
        <aside className="col-span-12 rounded-lg border border-border bg-surface p-3 shadow-card md:col-span-3 lg:col-span-2">
          <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-subtle">
            Navigation
          </p>
          <nav className="space-y-0.5">
            {NAV.map((item) => {
              const active =
                pathname === item.href || pathname.startsWith(`${item.href}/`);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`relative flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                    active
                      ? 'bg-primary text-white'
                      : 'text-text hover:bg-primary-soft hover:text-primary'
                  }`}
                >
                  {active ? (
                    <span className="absolute left-0 top-1.5 h-[calc(100%-12px)] w-[3px] rounded-r bg-accent" />
                  ) : null}
                  <Icon size={16} color={active ? '#C6A052' : undefined} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
          <div className="mt-6 rounded-lg bg-primary-soft p-3">
            <p className="text-xs font-semibold text-primary">Mission</p>
            <p className="mt-1 text-xs leading-4 text-muted">
              Reduce motorcycle dispatch volume in Lagos through premium drone
              delivery.
            </p>
          </div>
        </aside>
        <main className="col-span-12 space-y-6 md:col-span-9 lg:col-span-10">
          {children}
        </main>
      </div>
    </div>
  );
}
