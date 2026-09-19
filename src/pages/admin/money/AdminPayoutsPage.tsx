import { Surface } from '@shared/ui';
import React, { useState } from 'react';
import PayoutQueue from './PayoutQueue';
import PayoutHistory from './PayoutHistory';
import PayoutDrawer from './PayoutDrawer';
import PayoutDetail from './PayoutDetail';
import { SidebarNav } from '@shared/ui';
import { Clock, History } from 'lucide-react';

import { PendingPayoutResponse as PendingPayoutResponseSchema } from "@/api/generated/schemas/ledger/common";
import { z } from "zod";

type PendingPayoutResponse = z.infer<typeof PendingPayoutResponseSchema>;

export default function AdminPayoutsPage() {
  const [activeTab, setActiveTab] = useState<'queue' | 'history'>('queue');
  const [selectedQueueRow, setSelectedQueueRow] = useState<PendingPayoutResponse | null>(null);
  const [selectedPayoutId, setSelectedPayoutId] = useState<string | null>(null);

  if (selectedPayoutId) {
     return <PayoutDetail payoutId={selectedPayoutId} onBack={() => setSelectedPayoutId(null)} />;
  }

  return (
    <div className="flex h-full w-full">
      <Surface elevation={0} className="w-64 border-r p-4">
         <h2 className="text-xl font-black mb-6 px-4">Payouts</h2>
         <SidebarNav
            activeKey={activeTab}
            onSelect={(key) => setActiveTab(key as 'queue' | 'history')}
            items={[
              { key: 'queue', label: 'Pending Queue', icon: <Clock className="w-5 h-5" /> },
              { key: 'history', label: 'History', icon: <History className="w-5 h-5" /> },
            ]}
         />
      </Surface>

      <div className="flex-1 relative">
         {activeTab === 'queue' && <PayoutQueue onSelectRow={setSelectedQueueRow} />}
         {activeTab === 'history' && <PayoutHistory onSelectPayout={setSelectedPayoutId} />}
         
         {selectedQueueRow && (
            <PayoutDrawer 
                account={selectedQueueRow} 
                onClose={() => setSelectedQueueRow(null)} 
                onPayoutCreated={(payoutId) => {
                    setSelectedQueueRow(null);
                    setSelectedPayoutId(payoutId);
                }}
            />
         )}
      </div>
    </div>
  );
}
