import { ErrorBoundary } from "@shared/ui";
import { PaymentModal, PaymentMethodType } from "@shared/ui/PaymentModal";
import { MapPin, Store } from 'lucide-react';
import { formatINR } from '@shared/money';
import { useEffect, useState } from 'react';
import { walletApi } from '@/lib/zodiosClients';
import { getUserProfile } from '@/lib/tokenStore';
import { asUntyped } from '@/lib/untypedResponse';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function CustomerPaymentModal(props: any) {
  return (
    <ErrorBoundary>
      <CustomerPaymentModalInner {...props} />
    </ErrorBoundary>
  );
}

function CustomerPaymentModalInner({
  isPaymentModalOpen,
  setIsPaymentModalOpen,
  paymentStatus,
  getCartTotal,
  processPaymentAndOrder,
  cart,
  cartRestaurant,
  address,
  deliveryLat,
  deliveryLng
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
}: any) {
  const totals = getCartTotal ? getCartTotal() : { subtotal: 0, deliveryFee: 0, tax: 0, total: 0 };
  const [walletBalance, setWalletBalance] = useState<number | null>(null);

  useEffect(() => {
    if (isPaymentModalOpen) {
      const profile = getUserProfile();
      if (profile?.id) {
        walletApi.wallet.get('/api/v1/wallets/:entityType/:entityId', { 
          params: { entityType: 'CUSTOMER', entityId: profile.id } 
        }).then(res => {
          setWalletBalance((asUntyped<{balance?: number}>(res)).balance || 0);
        }).catch(err => {
          console.error("Failed to fetch wallet balance", err);
        });
      }
    }
  }, [isPaymentModalOpen]);

  const leftContent = (
    <>
      <div className="glass-card p-4 flex gap-4 items-center group relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-rose-500/10 to-orange-500/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
        <div className="w-12 h-12 rounded-full bg-rose-100 dark:bg-rose-500/20 flex items-center justify-center shrink-0">
          <MapPin className="w-6 h-6 text-rose-500" />
        </div>
        <div className="flex-1">
          <h4 className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-0.5">Delivering To</h4>
          <p className="text-sm font-semibold text-slate-800 dark:text-white line-clamp-2">{address || 'No address selected'}</p>
        </div>
      </div>

      {deliveryLat && deliveryLng && (
        <div className="h-32 w-full rounded-xl overflow-hidden border border-white/20 relative my-4">
          {/* Static map preview using a simple background grid and pin to represent map */}
          <div className="absolute inset-0 bg-slate-200 dark:bg-slate-800 flex items-center justify-center relative"
            style={{
              backgroundImage: 'radial-gradient(circle at center, #cbd5e1 1px, transparent 1px)',
              backgroundSize: '20px 20px'
            }}>
            <MapPin className="w-8 h-8 text-rose-500 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 drop-shadow-md" />
            <div className="absolute bottom-2 right-2 bg-white/80 dark:bg-slate-900/80 px-2 py-1 rounded text-[10px] font-mono text-slate-500 backdrop-blur-sm">
              {Number(deliveryLat).toFixed(4)}, {Number(deliveryLng).toFixed(4)}
            </div>
          </div>
        </div>
      )}

      <div className="glass-card p-4">
        <div className="flex items-center gap-2 mb-4 pb-3 border-b border-white/20 dark:border-white/10">
          <Store className="w-4 h-4 text-indigo-500" />
          <h3 className="font-bold text-slate-800 dark:text-white">{cartRestaurant?.name || 'Restaurant'}</h3>
        </div>

        <div className="space-y-3 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          {(cart || []).map((cItem: any, idx: number) => (
            <div key={idx} className="flex justify-between items-center text-sm">
              <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                <span className="bg-slate-100 dark:bg-slate-800/50 px-2 py-0.5 rounded text-xs font-semibold">{cItem.quantity}x</span>
                <span className="truncate max-w-[150px]">{cItem.item?.name}</span>
              </div>
              <span className="font-mono font-medium text-slate-800 dark:text-white">{formatINR((cItem.item?.price * cItem.quantity))}</span>
            </div>
          ))}
        </div>
      </div>
    </>
  );

  const disabledMethods: PaymentMethodType[] = [];
  const methodHints: Partial<Record<PaymentMethodType, React.ReactNode>> = {};

  if (walletBalance !== null && walletBalance < totals.total) {
    disabledMethods.push('WALLET');
    methodHints['WALLET'] = `Insufficient balance (${formatINR(walletBalance)})`;
  }
  
  methodHints['COD'] = "Please keep exact change ready";

  return (
    <PaymentModal
      isOpen={isPaymentModalOpen}
      onClose={() => setIsPaymentModalOpen(false)}
      status={paymentStatus}
      onProcessPayment={(method) => {
        processPaymentAndOrder(method);
      }}
      availableMethods={['CARD', 'WALLET', 'COD']}
      amount={totals.total}
      totals={totals}
      disabledMethods={disabledMethods}
      methodHints={methodHints}
      leftPanelContent={leftContent}
      title="Complete Your Order"
      successTitle="Order Confirmed!"
      successSubtitle="Your food is being prepared and will be with you shortly."
      processingTitle="Sending Order..."
      processingSubtitle={`Connecting to ${cartRestaurant?.name}`}
    />
  );
}

