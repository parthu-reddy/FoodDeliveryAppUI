import { Badge, Button, Surface } from '@shared/ui';
import { formatINR } from '@shared/money';
import type { Campaign } from '@features/campaigns-ads/model/campaign';
import { Calendar, Pause } from 'lucide-react';


/**
 * One ad campaign, as a card in the advertiser's list.
 *
 * Split out of CampaignManagement so the list is a list and the card is a card.
 */
export function CampaignCard({ campaign, onPause }: { campaign: Campaign; onPause: (id: string) => void }) {
  return (
      <Surface radius="lg" elevation={0} className="p-4 flex flex-col gap-3">
        <div className="flex justify-between items-start">
          <div>
            <h4 className="font-bold text-slate-900 dark:text-[#f0ede6] text-sm">{campaign.name}</h4>
            <div className="flex gap-2 text-[10px] font-mono mt-1 text-slate-500">
              <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {new Date(campaign.startDate).toLocaleDateString()}</span>
            </div>
          </div>
          <Badge variant={campaign.status === 'ACTIVE' ? 'success' : 'neutral'}>
            {campaign.status}
          </Badge>
        </div>
        
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="bg-slate-100 dark:bg-slate-800 p-2 rounded-lg">
            <div className="text-[10px] text-slate-400">Daily Budget</div>
            <div className="font-bold text-slate-800 dark:text-[#f0ede6]">{formatINR(campaign.dailyBudget)}</div>
          </div>
          <div className="bg-slate-100 dark:bg-slate-800 p-2 rounded-lg">
            <div className="text-[10px] text-slate-400">Total Budget</div>
            <div className="font-bold text-slate-800 dark:text-[#f0ede6]">{formatINR(campaign.totalBudget)}</div>
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-2">
          {campaign.status === 'ACTIVE' && (
            <Button variant="ghost" size="icon" onClick={() => onPause(campaign.id)} title="Pause Campaign">
              <Pause className="w-4 h-4" />
            </Button>
          )}
        </div>
      </Surface>
  );
}
