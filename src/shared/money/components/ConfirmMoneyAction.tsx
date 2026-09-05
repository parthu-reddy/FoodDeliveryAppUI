import React, { useState } from 'react';


interface Props {
  amount: number;
  effectSummary: string;
  buttonLabel: string;
  onConfirm: (idempotencyKey: string) => Promise<void>;
  isPending?: boolean;
}

export function ConfirmMoneyAction({ amount, effectSummary, buttonLabel, onConfirm, isPending }: Props) {
  const [typedAmount, setTypedAmount] = useState('');
  const requireTyping = amount >= 1000000; // >= ₹10,000 (in paise)
  
  const expectedText = (amount / 100).toString();
  const canSubmit = !isPending && (!requireTyping || typedAmount === expectedText);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    onConfirm(crypto.randomUUID());
  };

  return (
    <form onSubmit={handleSubmit} className="bg-slate-50 p-4 rounded-lg border border-slate-200">
      <p className="text-sm text-slate-700 font-medium mb-2">{effectSummary}</p>
      
      {requireTyping && (
        <div className="mb-4">
          <label className="block text-xs text-slate-500 mb-1">
            This is a large amount. Type <span className="font-mono font-bold text-slate-700">{expectedText}</span> to confirm:
          </label>
          <input
            type="text"
            value={typedAmount}
            onChange={e => setTypedAmount(e.target.value)}
            disabled={isPending}
            className="w-full border-slate-300 rounded-md text-sm px-3 py-2 disabled:bg-slate-100"
            placeholder={expectedText}
          />
        </div>
      )}
      
      <button
        type="submit"
        disabled={!canSubmit}
        className="w-full bg-blue-600 text-white font-medium py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:hover:bg-blue-600 transition-colors"
      >
        {isPending ? 'Processing...' : buttonLabel}
      </button>
    </form>
  );
}
