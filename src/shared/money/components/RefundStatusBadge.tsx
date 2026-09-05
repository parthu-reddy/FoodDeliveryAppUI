import React from 'react';

interface Props {
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
}

export function RefundStatusBadge({ status }: Props) {
  const config = {
    PENDING: { label: 'Pending', className: 'bg-slate-100 text-slate-700' },
    PROCESSING: { label: 'Processing', className: 'bg-amber-100 text-amber-700' },
    COMPLETED: { label: 'Completed', className: 'bg-emerald-100 text-emerald-700' },
    FAILED: { label: 'Failed', className: 'bg-rose-100 text-rose-700' }
  }[status];

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${config.className}`}>
      {config.label}
    </span>
  );
}
