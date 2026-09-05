import React from 'react';
import { CheckCircle2, Clock, AlertCircle } from 'lucide-react';

interface Props {
  status: 'DRAFT' | 'APPROVED' | 'PAID' | 'FAILED';
}

export function PayoutTimeline({ status }: Props) {
  const steps = [
    { key: 'DRAFT', label: 'Draft' },
    { key: 'APPROVED', label: 'Approved' },
    { key: 'PAID', label: 'Paid' }
  ];

  const currentIdx = steps.findIndex(s => s.key === status);
  
  return (
    <div className="flex items-center space-x-2">
      {steps.map((step, idx) => {
        let state = 'pending';
        if (status === 'FAILED' && step.key === 'PAID') state = 'failed';
        else if (currentIdx >= idx) state = 'completed';
        
        return (
          <div key={step.key} className="flex items-center">
            {idx > 0 && <div className={`w-8 h-0.5 mx-2 ${state === 'completed' || state === 'failed' ? 'bg-slate-300' : 'bg-slate-100'}`} />}
            <div className="flex flex-col items-center gap-1">
              {state === 'completed' ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
              ) : state === 'failed' ? (
                <AlertCircle className="w-5 h-5 text-rose-500" />
              ) : (
                <Clock className="w-5 h-5 text-slate-300" />
              )}
              <span className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">{step.label}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
