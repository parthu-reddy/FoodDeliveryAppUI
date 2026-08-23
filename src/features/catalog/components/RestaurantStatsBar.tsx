import { StatCard } from '@shared/ui';
import { CheckCircle, DollarSign } from 'lucide-react';

interface RestaurantStatsBarProps {
  totalRevenue: number;
  completedOrdersCount: number;
}

export function RestaurantStatsBar({
  totalRevenue,
  completedOrdersCount,
}: RestaurantStatsBarProps) {
  return (
    <div className="grid grid-cols-2 gap-4 mb-4">
      <StatCard
        icon={<DollarSign className="w-5 h-5" />}
        label="Today's Sales"
        value={`₹${totalRevenue.toFixed(2)}`}
        color="emerald"
      />
      <StatCard
        icon={<CheckCircle className="w-5 h-5" />}
        label="Completed"
        value={`${completedOrdersCount} orders`}
        color="blue"
      />
    </div>
  );
}
