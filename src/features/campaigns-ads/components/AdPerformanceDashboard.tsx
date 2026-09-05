import { format } from 'date-fns';
import { CheckCircle, Eye, MousePointerClick, TrendingUp } from 'lucide-react';
import { formatINR } from '@shared/money';

export interface CampaignPerformance {
  id: string;
  campaignId: string;
  advertiserId: string;
  date: string;
  impressions: number;
  clicks: number;
  conversions: number;
  spend: number;
}

interface AdPerformanceDashboardProps {
  performanceData: CampaignPerformance[];
  isLoading: boolean;
}

export function AdPerformanceDashboard({ performanceData, isLoading }: AdPerformanceDashboardProps) {
  
  if (isLoading) {
    return <div className="h-48 bg-slate-50 animate-pulse rounded-2xl border border-slate-100"></div>;
  }

  if (performanceData.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-white rounded-2xl border border-slate-200 shadow-sm">
        <TrendingUp className="w-12 h-12 text-slate-300 mb-4" />
        <h3 className="text-lg font-medium text-slate-900 mb-1">No Ad Performance Data</h3>
        <p className="text-slate-500 text-sm">Once your campaigns start running, metrics will appear here.</p>
      </div>
    );
  }

  // Aggregate totals
  const totals = performanceData.reduce((acc, curr) => ({
    impressions: acc.impressions + curr.impressions,
    clicks: acc.clicks + curr.clicks,
    conversions: acc.conversions + curr.conversions,
    spend: acc.spend + curr.spend,
  }), { impressions: 0, clicks: 0, conversions: 0, spend: 0 });

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
      <h3 className="text-lg font-medium text-slate-900 mb-6">Lifetime Campaign Performance</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
          <div className="flex items-center gap-2 text-slate-500 mb-2 text-sm font-medium">
            <Eye className="w-4 h-4 text-blue-500" /> Impressions
          </div>
          <div className="text-2xl font-bold text-slate-900">{totals.impressions.toLocaleString()}</div>
        </div>
        <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
          <div className="flex items-center gap-2 text-slate-500 mb-2 text-sm font-medium">
            <MousePointerClick className="w-4 h-4 text-violet-500" /> Clicks
          </div>
          <div className="text-2xl font-bold text-slate-900">{totals.clicks.toLocaleString()}</div>
        </div>
        <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
          <div className="flex items-center gap-2 text-slate-500 mb-2 text-sm font-medium">
            <CheckCircle className="w-4 h-4 text-emerald-500" /> Conversions
          </div>
          <div className="text-2xl font-bold text-slate-900">{totals.conversions.toLocaleString()}</div>
        </div>
        <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
          <div className="flex items-center gap-2 text-slate-500 mb-2 text-sm font-medium">
            <TrendingUp className="w-4 h-4 text-rose-500" /> Total Spend
          </div>
          <div className="text-2xl font-bold text-slate-900">{formatINR(totals.spend)}</div>
        </div>
      </div>

      <h4 className="text-sm font-medium text-slate-700 mb-4 uppercase tracking-wider">Daily Breakdown</h4>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-slate-600">
          <thead className="bg-slate-50 text-slate-700 font-medium border-y border-slate-200">
            <tr>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3 text-right">Impressions</th>
              <th className="px-4 py-3 text-right">Clicks</th>
              <th className="px-4 py-3 text-right">Conversions</th>
              <th className="px-4 py-3 text-right">Spend</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {performanceData.map((data) => (
              <tr key={data.id} className="hover:bg-slate-50/50">
                <td className="px-4 py-3">{format(new Date(data.date), 'MMM d, yyyy')}</td>
                <td className="px-4 py-3 text-right">{data.impressions.toLocaleString()}</td>
                <td className="px-4 py-3 text-right font-medium text-slate-900">{data.clicks.toLocaleString()}</td>
                <td className="px-4 py-3 text-right text-emerald-600">{data.conversions.toLocaleString()}</td>
                <td className="px-4 py-3 text-right font-medium">{formatINR(data.spend)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
