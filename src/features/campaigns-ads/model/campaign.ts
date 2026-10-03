/** One ad campaign, as the advertiser screens read it. */
export interface Campaign {
  id: string;
  name: string;
  status: string;
  dailyBudget: number;
  lifetimeBudget?: number;
  startDate: string;
  endDate?: string;
}
