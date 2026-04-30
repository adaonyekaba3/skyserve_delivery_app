'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { UserButton } from '@clerk/nextjs';

const nav: { href: string; label: string; icon: string }[] = [
  { href: '/orders', label: 'Orders', icon: '📦' },
  { href: '/fleet', label: 'Fleet', icon: '🚁' },
  { href: '/map', label: 'Live Map', icon: '🗺️' },
];

export default function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <div className="min-h-screen bg-bg">
      <header className="border-b border-border bg-surface">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
              <span className="text-lg font-bold text-accent">S</span>
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-text">SkyServe Admin</h1>
              <p className="text-xs text-muted">Realtime operations dashboard</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="hidden md:inline-flex items-center rounded-full bg-success-soft px-3 py-1 text-xs font-semibold text-success">
              <span className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-success" />
              All systems nominal
            </span>
            <UserButton afterSignOutUrl="/sign-in" />
          </div>
        </div>
      </header>
      <div className="mx-auto grid max-w-7xl grid-cols-12 gap-6 px-6 py-6">
        <aside className="col-span-12 rounded-lg border border-border bg-surface p-3 shadow-card md:col-span-3 lg:col-span-2">
          <p className="px-3 pb-2 text-xs font-semibold uppercase tracking-wider text-subtle">
            Navigation
          </p>
          <nav className="space-y-1">
            {nav.map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                    active
                      ? 'bg-primary text-white shadow-sm'
                      : 'text-text hover:bg-primary-soft hover:text-primary'
                  }`}
                >
                  <span className="text-base">{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
          <div className="mt-6 rounded-lg bg-primary-soft p-3">
            <p className="text-xs font-semibold text-primary">Need help?</p>
            <p className="mt-1 text-xs text-muted">
              Reach out to ops@skyserve.app for support.
            </p>
          </div>
        </aside>
        <main className="col-span-12 md:col-span-9 lg:col-span-10">{children}</main>
      </div>
    </div>
  );
}
