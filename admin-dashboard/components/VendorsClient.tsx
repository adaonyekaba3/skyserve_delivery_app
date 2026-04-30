'use client';

import { useEffect, useMemo, useState } from 'react';
import { Store, Plus, MapPin, Tag, X, ChefHat } from 'lucide-react';
import {
  Card,
  PageHero,
  SectionHeader,
  Button,
  Badge,
  EmptyState,
  Switch,
} from './ui';
import {
  createVendor,
  fetchVendorPerformance,
  fetchVendors,
  setVendorActive,
} from '@/lib/api.client';
import type {
  CreateVendorPayload,
  Vendor,
  VendorPerformance,
} from '@/lib/types';
import { LAGOS_ZONES, RESTAURANT_CATEGORIES } from '@/lib/types';
import { useAdminBus } from '@/lib/useAdminBus';

interface VendorsClientProps {
  initialVendors: Vendor[];
}

const PERFORMANCE_PROBE_LIMIT = 8;

export default function VendorsClient({ initialVendors }: VendorsClientProps) {
  const [vendors, setVendors] = useState<Vendor[]>(initialVendors);
  const [perf, setPerf] = useState<Record<string, VendorPerformance>>({});
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const refresh = async () => {
    try {
      const next = await fetchVendors();
      setVendors(next);
    } catch {
      // best-effort refresh; existing list stays in place
    }
  };

  useAdminBus({
    onVendorChanged: () => {
      refresh();
    },
  });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const subset = vendors.slice(0, PERFORMANCE_PROBE_LIMIT);
      const results = await Promise.all(
        subset.map(async (v) => {
          try {
            const p = await fetchVendorPerformance(v.id);
            return [v.id, p] as const;
          } catch {
            return [v.id, null] as const;
          }
        }),
      );
      if (cancelled) return;
      const next: Record<string, VendorPerformance> = {};
      for (const [id, p] of results) {
        if (p) next[id] = p;
      }
      setPerf(next);
    })();
    return () => {
      cancelled = true;
    };
  }, [vendors]);

  const stats = useMemo(() => {
    const active = vendors.filter((v) => v.isActive).length;
    return { total: vendors.length, active, inactive: vendors.length - active };
  }, [vendors]);

  const handleToggle = async (vendor: Vendor, next: boolean) => {
    setSavingId(vendor.id);
    setVendors((prev) =>
      prev.map((v) => (v.id === vendor.id ? { ...v, isActive: next } : v)),
    );
    try {
      await setVendorActive(vendor.id, next);
    } catch {
      setErrorMsg('Failed to update vendor status');
      setVendors((prev) =>
        prev.map((v) => (v.id === vendor.id ? { ...v, isActive: !next } : v)),
      );
    } finally {
      setSavingId(null);
    }
  };

  const handleCreate = async (payload: CreateVendorPayload) => {
    setCreating(true);
    setErrorMsg(null);
    try {
      const created = await createVendor(payload);
      setVendors((prev) => [created, ...prev]);
      setDrawerOpen(false);
    } catch {
      setErrorMsg('Failed to create vendor. Check inputs.');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHero
        title="Vendor management"
        subtitle="Onboard restaurants, control activation, and track per-vendor volume."
        icon={Store}
        trailing={
          <Button
            label="Add vendor"
            icon={<Plus size={14} />}
            variant="gold"
            onClick={() => setDrawerOpen(true)}
          />
        }
      />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Card padding="lg">
          <p className="text-[11px] uppercase tracking-[0.16em] text-subtle font-semibold">
            Total vendors
          </p>
          <p className="mt-2 text-2xl font-bold text-text">{stats.total}</p>
        </Card>
        <Card padding="lg">
          <p className="text-[11px] uppercase tracking-[0.16em] text-subtle font-semibold">
            Active
          </p>
          <p className="mt-2 text-2xl font-bold text-text">{stats.active}</p>
        </Card>
        <Card padding="lg">
          <p className="text-[11px] uppercase tracking-[0.16em] text-subtle font-semibold">
            Inactive
          </p>
          <p className="mt-2 text-2xl font-bold text-text">{stats.inactive}</p>
        </Card>
      </div>

      {errorMsg ? (
        <div className="rounded-md border border-danger/30 bg-danger-soft px-4 py-2 text-sm text-danger">
          {errorMsg}
        </div>
      ) : null}

      <Card padding="lg">
        <SectionHeader
          label="VENDORS"
          hint="Toggle a vendor on or off. Performance refreshes when you reopen the page."
        />
        {vendors.length === 0 ? (
          <EmptyState
            icon={<Store size={20} color="#0B1C2C" />}
            title="No vendors yet"
            description="Onboard your first restaurant to start accepting orders."
            ctaLabel="Add vendor"
            onCta={() => setDrawerOpen(true)}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border text-[11px] uppercase tracking-[0.16em] text-subtle">
                  <th className="pb-3 pr-4 font-semibold">Vendor</th>
                  <th className="pb-3 pr-4 font-semibold">Zone</th>
                  <th className="pb-3 pr-4 font-semibold">Category</th>
                  <th className="pb-3 pr-4 font-semibold">Orders 7d</th>
                  <th className="pb-3 pr-4 font-semibold">Avg ticket</th>
                  <th className="pb-3 font-semibold text-right">Status</th>
                </tr>
              </thead>
              <tbody>
                {vendors.map((vendor) => {
                  const p = perf[vendor.id];
                  return (
                    <tr
                      key={vendor.id}
                      className="border-b border-hairline last:border-b-0 hover:bg-bg"
                    >
                      <td className="py-3 pr-4">
                        <p className="font-semibold text-text">{vendor.name}</p>
                        <p className="text-[11px] text-subtle truncate max-w-[280px]">
                          {vendor.address}
                        </p>
                      </td>
                      <td className="py-3 pr-4">
                        {vendor.location ? (
                          <span className="inline-flex items-center gap-1 text-muted text-xs">
                            <MapPin size={12} color="#C6A052" />
                            {vendor.location}
                          </span>
                        ) : (
                          <span className="text-subtle text-xs">—</span>
                        )}
                      </td>
                      <td className="py-3 pr-4">
                        {vendor.category ? (
                          <Badge
                            label={vendor.category}
                            tone="primary"
                            size="sm"
                          />
                        ) : (
                          <span className="text-subtle text-xs">—</span>
                        )}
                      </td>
                      <td className="py-3 pr-4 text-text">
                        {p ? (
                          p.ordersLast7d
                        ) : (
                          <span className="text-subtle">…</span>
                        )}
                      </td>
                      <td className="py-3 pr-4 text-text">
                        {p ? (
                          `₦${Math.round(p.avgTicketNgn).toLocaleString()}`
                        ) : (
                          <span className="text-subtle">…</span>
                        )}
                      </td>
                      <td className="py-3 text-right">
                        <div className="inline-flex items-center justify-end gap-2">
                          {savingId === vendor.id ? (
                            <span className="text-[11px] text-subtle">
                              Saving…
                            </span>
                          ) : null}
                          <Switch
                            checked={vendor.isActive}
                            onChange={(next) => handleToggle(vendor, next)}
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {drawerOpen ? (
        <AddVendorDrawer
          onClose={() => setDrawerOpen(false)}
          onSubmit={handleCreate}
          submitting={creating}
        />
      ) : null}
    </div>
  );
}

interface AddVendorDrawerProps {
  onClose: () => void;
  onSubmit: (payload: CreateVendorPayload) => void;
  submitting: boolean;
}

function AddVendorDrawer({
  onClose,
  onSubmit,
  submitting,
}: AddVendorDrawerProps) {
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [latitude, setLatitude] = useState('6.4541');
  const [longitude, setLongitude] = useState('3.4316');
  const [category, setCategory] = useState<string>(RESTAURANT_CATEGORIES[0]);
  const [location, setLocation] = useState<string>(LAGOS_ZONES[0]);
  const [isActive, setIsActive] = useState(true);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !address.trim()) return;
    onSubmit({
      name: name.trim(),
      address: address.trim(),
      latitude,
      longitude,
      category,
      location,
      isActive,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex">
      <div
        className="absolute inset-0 bg-primary/40 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />
      <form
        onSubmit={submit}
        className="relative ml-auto flex h-full w-full max-w-md flex-col overflow-y-auto bg-surface shadow-navy"
      >
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div className="flex items-center gap-2">
            <ChefHat size={16} color="#C6A052" />
            <h2 className="text-base font-bold text-text">
              Onboard new vendor
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-hairline"
          >
            <X size={16} />
          </button>
        </div>

        <div className="flex-1 space-y-4 px-5 py-5">
          <Field label="Restaurant name">
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm focus:border-primary focus:outline-none"
              placeholder="e.g. Nok by Alara"
            />
          </Field>

          <Field label="Address">
            <input
              required
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm focus:border-primary focus:outline-none"
              placeholder="e.g. 12A Kingsway Rd, Ikoyi"
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Latitude">
              <input
                value={latitude}
                onChange={(e) => setLatitude(e.target.value)}
                className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm focus:border-primary focus:outline-none"
              />
            </Field>
            <Field label="Longitude">
              <input
                value={longitude}
                onChange={(e) => setLongitude(e.target.value)}
                className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm focus:border-primary focus:outline-none"
              />
            </Field>
          </div>

          <Field label="Category">
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm focus:border-primary focus:outline-none"
            >
              {RESTAURANT_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Lagos zone">
            <select
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm focus:border-primary focus:outline-none"
            >
              {LAGOS_ZONES.map((z) => (
                <option key={z} value={z}>
                  {z}
                </option>
              ))}
            </select>
          </Field>

          <div className="flex items-center justify-between rounded-lg border border-border bg-bg px-3 py-2.5">
            <div>
              <p className="text-sm font-medium text-text">
                Activate immediately
              </p>
              <p className="text-[11px] text-muted">
                Inactive vendors are hidden from the consumer app.
              </p>
            </div>
            <Switch checked={isActive} onChange={setIsActive} />
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-border px-5 py-4">
          <Button
            type="button"
            label="Cancel"
            variant="ghost"
            onClick={onClose}
          />
          <Button
            type="submit"
            label="Save vendor"
            icon={<Tag size={14} />}
            loading={submitting}
          />
        </div>
      </form>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-[11px] uppercase tracking-[0.16em] font-semibold text-subtle">
        {label}
      </span>
      {children}
    </label>
  );
}
