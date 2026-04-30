'use client';

import { useEffect, useMemo, useState } from 'react';
import { Inbox, Package as PackageIcon, Send } from 'lucide-react';
import { fetchPackages } from '@/lib/api.client';
import type { Package } from '@/lib/types';
import { useAdminBus } from '@/lib/useAdminBus';
import { Badge, Card, EmptyState, PageHero, SectionHeader } from './ui';

export default function PackagesClient({
  initialPackages,
}: {
  initialPackages: Package[];
}) {
  const [rows, setRows] = useState<Package[]>(initialPackages);

  const refresh = async () => {
    try {
      setRows(await fetchPackages());
    } catch {
      // keep stale data
    }
  };

  useAdminBus({
    onPackageChanged: refresh,
    onOrderChanged: refresh,
  });

  useEffect(() => {
    const i = setInterval(refresh, 30_000);
    return () => clearInterval(i);
  }, []);

  const stats = useMemo(() => {
    const fragile = rows.filter((r) => r.isFragile).length;
    const priority = rows.filter((r) => r.weightClass === 'heavy').length;
    return { total: rows.length, fragile, priority };
  }, [rows]);

  return (
    <div className="space-y-6">
      <PageHero
        title="Package deliveries"
        subtitle="Monitor package courier traffic and recipient distribution."
        icon={Send}
      />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Card padding="lg">
          <p className="text-[11px] uppercase tracking-[0.16em] text-subtle font-semibold">
            Total packages
          </p>
          <p className="mt-2 text-2xl font-bold text-text">{stats.total}</p>
        </Card>
        <Card padding="lg">
          <p className="text-[11px] uppercase tracking-[0.16em] text-subtle font-semibold">
            Fragile
          </p>
          <p className="mt-2 text-2xl font-bold text-text">{stats.fragile}</p>
        </Card>
        <Card padding="lg">
          <p className="text-[11px] uppercase tracking-[0.16em] text-subtle font-semibold">
            Heavy class
          </p>
          <p className="mt-2 text-2xl font-bold text-text">{stats.priority}</p>
        </Card>
      </div>

      <Card padding="lg">
        <SectionHeader
          label="PACKAGES"
          hint={`${rows.length} package deliveries`}
        />
        {rows.length === 0 ? (
          <EmptyState
            icon={<Inbox size={20} color="#0B1C2C" />}
            title="No package deliveries yet"
            description="As users send packages, they will appear here in realtime."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border text-[11px] uppercase tracking-[0.16em] text-subtle">
                  <th className="pb-3 pr-4 font-semibold">Package</th>
                  <th className="pb-3 pr-4 font-semibold">Recipient</th>
                  <th className="pb-3 pr-4 font-semibold">Route</th>
                  <th className="pb-3 pr-4 font-semibold">Type</th>
                  <th className="pb-3 font-semibold">Created</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((pkg) => (
                  <tr
                    key={pkg.id}
                    className="border-b border-hairline last:border-b-0 hover:bg-bg"
                  >
                    <td className="py-3 pr-4">
                      <div className="flex items-center gap-2">
                        <PackageIcon size={14} color="#0B1C2C" />
                        <span className="font-mono text-xs font-semibold text-text">
                          #{pkg.id.slice(0, 8)}
                        </span>
                        {pkg.isFragile ? (
                          <Badge label="Fragile" tone="warning" size="sm" />
                        ) : null}
                      </div>
                      <p className="mt-0.5 text-[11px] text-subtle">
                        Track: {pkg.trackingToken}
                      </p>
                    </td>
                    <td className="py-3 pr-4">
                      <p className="text-text">{pkg.recipientPhone}</p>
                      <Badge
                        label={pkg.recipientType}
                        tone={
                          pkg.recipientType === 'user'
                            ? 'success'
                            : pkg.recipientType === 'vendor'
                              ? 'primary'
                              : 'neutral'
                        }
                        size="sm"
                      />
                    </td>
                    <td className="py-3 pr-4 text-muted max-w-[360px]">
                      <p className="truncate">{pkg.pickupAddress}</p>
                      <p className="truncate text-[11px]">→ {pkg.dropoffAddress}</p>
                    </td>
                    <td className="py-3 pr-4">
                      <Badge
                        label={`${pkg.category} · ${pkg.weightClass}`}
                        tone="gold"
                        size="sm"
                      />
                    </td>
                    <td className="py-3 text-subtle">
                      {new Date(pkg.createdAt).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
