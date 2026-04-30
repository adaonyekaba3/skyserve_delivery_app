'use client';

import type { OrderStatus } from '@/lib/types';

const options: Array<{ value: OrderStatus | 'ALL'; label: string }> = [
  { value: 'ALL', label: 'All' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'ACCEPTED', label: 'Accepted' },
  { value: 'PREPARING', label: 'Preparing' },
  { value: 'PICKED_UP', label: 'Picked up' },
  { value: 'IN_FLIGHT', label: 'In flight' },
  { value: 'DELIVERED', label: 'Delivered' },
  { value: 'CANCELLED', label: 'Cancelled' },
];

export default function StatusFilter({
  value,
  onChange,
}: {
  value: OrderStatus | 'ALL';
  onChange: (value: OrderStatus | 'ALL') => void;
}) {
  return (
    <div className="mb-4 flex flex-wrap gap-2">
      {options.map((option) => {
        const active = value === option.value;
        return (
          <button
            key={option.value}
            onClick={() => onChange(option.value)}
            className={`rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors ${
              active
                ? 'border-primary bg-primary text-white shadow-sm'
                : 'border-border bg-surface text-muted hover:border-primary hover:text-primary'
            }`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
