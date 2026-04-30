'use client';

import { useEffect, useMemo, useState } from 'react';
import { Banknote, Clock, XCircle } from 'lucide-react';
import {
  approveBankTransfer,
  fetchBankTransfers,
  rejectBankTransfer,
} from '@/lib/api.client';
import type { BankTransfer, BankTransferStatus } from '@/lib/types';
import { useAdminBus } from '@/lib/useAdminBus';
import { Badge, Button, Card, PageHero, SectionHeader } from './ui';

const TABS: Array<BankTransferStatus | 'ALL'> = [
  'ALL',
  'PENDING_REVIEW',
  'APPROVED',
  'REJECTED',
];

export default function BankTransfersClient({
  initialRows,
}: {
  initialRows: BankTransfer[];
}) {
  const [rows, setRows] = useState(initialRows);
  const [tab, setTab] = useState<BankTransferStatus | 'ALL'>('PENDING_REVIEW');
  const [busyId, setBusyId] = useState<string | null>(null);

  const refresh = async () => {
    try {
      const status = tab === 'ALL' ? undefined : tab;
      setRows(await fetchBankTransfers(status));
    } catch {
      // keep stale
    }
  };

  useAdminBus({ onBankTransferChanged: refresh });

  useEffect(() => {
    void refresh();
  }, [tab]);

  const pendingCount = useMemo(
    () => rows.filter((r) => r.status === 'PENDING_REVIEW').length,
    [rows],
  );

  const actApprove = async (id: string) => {
    setBusyId(id);
    try {
      await approveBankTransfer(id);
      await refresh();
    } finally {
      setBusyId(null);
    }
  };

  const actReject = async (id: string) => {
    const reason = window.prompt('Reason for rejection')?.trim() || 'Rejected';
    setBusyId(id);
    try {
      await rejectBankTransfer(id, reason);
      await refresh();
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-6">
      <PageHero
        title="Bank transfer queue"
        subtitle="Review uploaded proof and approve/reject payouts."
        icon={Banknote}
        trailing={
          <Badge
            label={`${pendingCount} pending`}
            tone={pendingCount > 0 ? 'warning' : 'success'}
          />
        }
      />

      <Card padding="lg">
        <SectionHeader label="TRANSFERS" hint="Manual verification queue" />
        <div className="mb-4 flex flex-wrap gap-2">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                tab === t
                  ? 'bg-primary text-white'
                  : 'bg-primary-soft text-primary'
              }`}
            >
              {t.replace('_', ' ')}
            </button>
          ))}
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border text-[11px] uppercase tracking-[0.16em] text-subtle">
                <th className="pb-3 pr-4 font-semibold">Transfer</th>
                <th className="pb-3 pr-4 font-semibold">Status</th>
                <th className="pb-3 pr-4 font-semibold">Proof</th>
                <th className="pb-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-b border-hairline last:border-b-0">
                  <td className="py-3 pr-4">
                    <p className="font-mono text-xs text-text">#{row.id.slice(0, 8)}</p>
                    <p className="text-[11px] text-subtle">Order {row.orderId.slice(0, 8)}</p>
                  </td>
                  <td className="py-3 pr-4">
                    <Badge
                      label={row.status}
                      tone={
                        row.status === 'APPROVED'
                          ? 'success'
                          : row.status === 'REJECTED'
                            ? 'danger'
                            : 'warning'
                      }
                    />
                  </td>
                  <td className="py-3 pr-4">
                    {row.proofUrl ? (
                      <a
                        href={row.proofUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-primary underline"
                      >
                        View proof
                      </a>
                    ) : (
                      <span className="text-subtle">No upload</span>
                    )}
                  </td>
                  <td className="py-3">
                    {row.status === 'PENDING_REVIEW' ? (
                      <div className="flex items-center gap-2">
                        <Button
                          label="Approve"
                          size="sm"
                          onClick={() => actApprove(row.id)}
                          loading={busyId === row.id}
                        />
                        <Button
                          label="Reject"
                          size="sm"
                          variant="danger"
                          onClick={() => actReject(row.id)}
                          loading={busyId === row.id}
                        />
                      </div>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs text-subtle">
                        {row.status === 'APPROVED' ? (
                          <Clock size={12} />
                        ) : (
                          <XCircle size={12} />
                        )}
                        Closed
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
