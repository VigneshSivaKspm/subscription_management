export interface AnalyticsData {
  id: string;
  date: Date;
  totalSubscriptions: number;
  activeSubscriptions: number;
  cancelledSubscriptions: number;
  expiredSubscriptions: number;
  totalRevenue: number;
  newSubscriptions: number;
  churnRate: number;
  averageSubscriptionValue: number;
  subscriptionsByPlan: Record<string, number>;
  subscriptionsByBillingCycle: Record<string, number>;
  monthlyRecurringRevenue: number;
  updatedAt: Date;
}

export interface DailyAnalytics {
  date: Date;
  newSubscriptions: number;
  cancelledSubscriptions: number;
  revenue: number;
}

export interface AnnualAnalytics {
  year: number;
  totalRevenue: number;
  totalSubscriptions: number;
  averageMonthlyRevenue: number;
  monthlyBreakdown: Record<string, number>;
}
