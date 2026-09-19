/** One ad campaign, as the advertiser screens read it. */
export interface Campaign {
  id: string;
  name: string;
  status: string;
  dailyBudget: number;
  totalBudget?: number;
  startDate: string;
  endDate?: string;
}
