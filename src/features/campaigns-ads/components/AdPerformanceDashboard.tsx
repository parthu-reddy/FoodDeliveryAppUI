import { Surface } from '@shared/ui';
import { format } from 'date-fns';
import { CheckCircle, Eye, MousePointerClick, TrendingUp } from 'lucide-react';
import { formatINR } from '@shared/money';
import { DataTable, type Column } from '@shared/ui';

export interface CampaignPerformance {
  id: string;
  campaignId: string;
  advertiserId: string;
  date: string;
  impressions?: number;
  clicks?: number;
  conversions?: number;
  spend: number;
}

const PERFORMANCE_COLUMNS: Column<CampaignPerformance>[] = [
  { key: 'date', header: 'Date', cell: (row) => format(new Date(row.date), 'MMM d, yyyy') },
  { key: 'impressions', header: 'Impressions', align: 'right', cell: (row) => (row.impressions ?? 0).toLocaleString() },
  { key: 'clicks', header: 'Clicks', align: 'right', cell: (row) => (row.clicks ?? 0).toLocaleString(), cellClassName: 'font-medium' },
  { key: 'conversions', header: 'Conversions', align: 'right', cell: (row) => (row.conversions ?? 0).toLocaleString() },
  { key: 'spend', header: 'Spend', align: 'right', cell: (row) => formatINR(row.spend), cellClassName: 'font-medium font-mono' },
];

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
      <Surface radius="lg" elevation={1} className="flex flex-col items-center justify-center p-12">
        <TrendingUp className="w-12 h-12 text-slate-300 mb-4" />
        <h3 className="text-lg font-medium text-slate-900 mb-1">No Ad Performance Data</h3>
        <p className="text-slate-500 text-sm">Once your campaigns start running, metrics will appear here.</p>
      </Surface>
    );
  }

  // Aggregate totals
  const totals = performanceData.reduce((acc, curr) => ({
    impressions: acc.impressions + (curr.impressions ?? 0),
    clicks: acc.clicks + (curr.clicks ?? 0),
    conversions: acc.conversions + (curr.conversions ?? 0),
    spend: acc.spend + curr.spend,
  }), { impressions: 0, clicks: 0, conversions: 0, spend: 0 });

  return (
    <Surface radius="lg" elevation={1} className="p-6">
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
            <MousePointerClick className="w-4 h-4 text-rose-500" /> Clicks
          </div>
          <div className="text-2xl font-bold text-slate-900">{totals.clicks.toLocaleString()}</div>
        </div>
        <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
          <div className="flex items-center gap-2 text-slate-500 mb-2 text-sm font-medium">
            <CheckCircle className="w-4 h-4 text-amber-500" /> Conversions
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
      <DataTable
        caption="Daily ad performance"
        rows={performanceData}
        rowKey={(row) => row.id}
        emptyMessage="No performance data for this period."
        columns={PERFORMANCE_COLUMNS}
      />
    </Surface>
  );
}
