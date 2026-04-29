'use client';

import type { OrderStatus } from '@/lib/types';

const options: Array<OrderStatus | 'ALL'> = [
  'ALL',
  'PENDING',
  'ACCEPTED',
  'PREPARING',
  'PICKED_UP',
  'IN_FLIGHT',
  'DELIVERED',
  'CANCELLED',
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
      {options.map((status) => (
        <button
          key={status}
          onClick={() => onChange(status)}
          className={`rounded-full border px-3 py-1 text-xs ${
            value === status
              ? 'border-slate-900 bg-slate-900 text-white'
              : 'border-slate-300 bg-white text-slate-700'
          }`}
        >
          {status}
        </button>
      ))}
    </div>
  );
}
