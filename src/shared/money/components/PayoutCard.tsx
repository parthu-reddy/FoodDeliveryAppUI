import React from 'react';
import { Money } from './Money';
import { PayoutTimeline } from './PayoutTimeline';

interface Props {
  payoutId: string;
  amount: number;
  status: 'DRAFT' | 'APPROVED' | 'PAID' | 'FAILED';
  createdAt: string;
  onClick?: () => void;
}

export function PayoutCard({ payoutId, amount, status, createdAt, onClick }: Props) {
  return (
    <div 
      onClick={onClick}
      className={`bg-white border border-slate-200 rounded-xl p-5 ${onClick ? 'cursor-pointer hover:border-blue-300 transition-colors' : ''}`}
    >
      <div className="flex justify-between items-start mb-4">
        <div>
          <p className="text-sm font-medium text-slate-500 mb-1">Payout {payoutId}</p>
          <div className="text-2xl font-bold text-slate-900">
            <Money value={amount} />
          </div>
        </div>
        <div className="text-right">
          <p className="text-sm text-slate-500">{new Date(createdAt).toLocaleDateString()}</p>
        </div>
      </div>
      <div className="pt-4 border-t border-slate-100">
        <PayoutTimeline status={status} />
      </div>
    </div>
  );
}
