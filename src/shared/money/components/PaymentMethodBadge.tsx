import React from 'react';
import { CreditCard, Wallet, Smartphone } from 'lucide-react';

interface Props {
  method: 'UPI' | 'CARD' | 'WALLET';
}

export function PaymentMethodBadge({ method }: Props) {
  const config = {
    UPI: { icon: Smartphone, label: 'UPI', className: 'bg-blue-50 text-blue-700 border-blue-200' },
    CARD: { icon: CreditCard, label: 'Card', className: 'bg-rose-50 text-rose-700 border-rose-200' },
    WALLET: { icon: Wallet, label: 'Store Credit', className: 'bg-amber-50 text-amber-700 border-amber-200' }
  }[method];

  if (!config) return null;
  const Icon = config.icon;

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border ${config.className}`}>
      <Icon className="w-3.5 h-3.5" />
      {config.label}
    </span>
  );
}
