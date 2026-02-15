import { Injectable, Logger } from '@nestjs/common';
import { FirestoreService } from '../firebase/firestore.service';

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);

  constructor(private firestoreService: FirestoreService) {}

  async recordEvent(userId: string, event: string, metadata?: Record<string, any>) {
    try {
      await this.firestoreService.recordAnalytics({
        userId,
        event,
        metadata,
      });
      this.logger.log(`Event recorded: ${event} for user ${userId}`);
    } catch (error) {
      this.logger.error('Error recording event:', error);
      throw error;
    }
  }

  async getDashboardStats() {
    try {
      const [users, subscriptions, invoices, activeSubscriptions] = await Promise.all([
        this.firestoreService.getAllUsers({ limit: 100000 }),
        this.firestoreService.getAllSubscriptions({ limit: 100000 }),
        this.firestoreService.getAnalyticsReport(),
        this.firestoreService.getAllSubscriptions({ status: 'active', limit: 100000 }),
      ]);

      const totalRevenue = subscriptions.reduce((sum, sub) => {
        return sum + ((sub.price || 0) * (sub.billingCycle === 'monthly' ? 1 : sub.billingCycle === 'quarterly' ? 3 : 12));
      }, 0);

      const activeUsers = users.filter((u) => (u as any).status === 'active').length;
      const adminUsers = users.filter((u) => u.role === 'admin').length;
      const regularUsers = users.filter((u) => u.role === 'user').length;

      return {
        totalUsers: users.length,
        activeUsers,
        adminUsers,
        regularUsers,
        totalSubscriptions: subscriptions.length,
        activeSubscriptions: activeSubscriptions.length,
        inactiveSubscriptions: subscriptions.length - activeSubscriptions.length,
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        averageRevenuePerUser:
          users.length > 0 ? Math.round((totalRevenue / users.length) * 100) / 100 : 0,
      };
    } catch (error) {
      this.logger.error('Error getting dashboard stats:', error);
      throw error;
    }
  }

  async getUserStats(userId: string) {
    try {
      const [subscriptions, invoices, analytics] = await Promise.all([
        this.firestoreService.getUserSubscriptions(userId),
        this.firestoreService.getUserInvoices(userId),
        this.firestoreService.getAnalyticsByUser(userId),
      ]);

      const activeSubscriptions = subscriptions.filter((s) => s.status === 'active');
      const totalSpent = subscriptions.reduce((sum, sub) => sum + (sub.price || 0), 0);
      const nextRenewal = activeSubscriptions.length > 0
        ? new Date(Math.min(...activeSubscriptions.map((s) => {
            const date = s.renewalDate;
            const timestamp = date instanceof Date ? date.getTime() : (date as any)?.toDate?.().getTime?.() || 0;
            return timestamp;
          })))
        : null;

      return {
        totalSubscriptions: subscriptions.length,
        activeSubscriptions: activeSubscriptions.length,
        cancelledSubscriptions: subscriptions.filter((s) => s.status === 'cancelled').length,
        totalSpent,
        pendingInvoices: invoices.filter((i) => (i as any).status === 'pending').length,
        nextRenewal,
        recentActivity: analytics.slice(0, 10),
      };
    } catch (error) {
      this.logger.error('Error getting user stats:', error);
      throw error;
    }
  }

  async getSubscriptionStats() {
    try {
      const subscriptions = await this.firestoreService.getAllSubscriptions({ limit: 100000 });

      const statsByStatus = {
        active: subscriptions.filter((s) => s.status === 'active').length,
        cancelled: subscriptions.filter((s) => s.status === 'cancelled').length,
        expired: subscriptions.filter((s) => s.status === 'expired').length,
        paused: subscriptions.filter((s) => s.status === 'paused').length,
        pending: subscriptions.filter((s) => s.status === 'pending').length,
      };

      const statsByBillingCycle = {
        monthly: subscriptions.filter((s) => s.billingCycle === 'monthly').length,
        quarterly: subscriptions.filter((s) => s.billingCycle === 'quarterly').length,
        yearly: subscriptions.filter((s) => s.billingCycle === 'yearly').length,
      };

      const revenueByBillingCycle = {
        monthly: subscriptions
          .filter((s) => s.billingCycle === 'monthly' && s.status === 'active')
          .reduce((sum, s) => sum + (s.price || 0), 0),
        quarterly: subscriptions
          .filter((s) => s.billingCycle === 'quarterly' && s.status === 'active')
          .reduce((sum, s) => sum + (s.price || 0) * 3, 0),
        yearly: subscriptions
          .filter((s) => s.billingCycle === 'yearly' && s.status === 'active')
          .reduce((sum, s) => sum + (s.price || 0) * 12, 0),
      };

      return {
        totalSubscriptions: subscriptions.length,
        statsByStatus,
        statsByBillingCycle,
        revenueByBillingCycle,
        totalMonthlyRecurringRevenue:
          revenueByBillingCycle.monthly +
          Math.round((revenueByBillingCycle.quarterly / 3) * 100) / 100 +
          Math.round((revenueByBillingCycle.yearly / 12) * 100) / 100,
      };
    } catch (error) {
      this.logger.error('Error getting subscription stats:', error);
      throw error;
    }
  }

  async getRevenueReport(startDate: Date, endDate: Date) {
    try {
      const subscriptions = await this.firestoreService.getAllSubscriptions({ limit: 100000 });

      const filtered = subscriptions.filter((s) => {
        const createdAt = s.createdAt instanceof Date ? s.createdAt : (s.createdAt as any)?.toDate?.() || new Date();
        return createdAt >= startDate && createdAt <= endDate;
      });

      const totalRevenue = filtered.reduce((sum, s) => sum + (s.price || 0), 0);
      const avgRevenue = filtered.length > 0 ? Math.round((totalRevenue / filtered.length) * 100) / 100 : 0;

      const revenueByPlan: Record<string, { count: number; total: number }> = {};
      filtered.forEach((s) => {
        if (!revenueByPlan[s.planName]) {
          revenueByPlan[s.planName] = { count: 0, total: 0 };
        }
        revenueByPlan[s.planName].count += 1;
        revenueByPlan[s.planName].total += s.price || 0;
      });

      return {
        period: {
          startDate,
          endDate,
        },
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        avgRevenue,
        subscriptionsCount: filtered.length,
        revenueByPlan,
      };
    } catch (error) {
      this.logger.error('Error generating revenue report:', error);
      throw error;
    }
  }

  async getUserGrowthReport(days = 30) {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const users = await this.firestoreService.getAllUsers({ limit: 100000 });

      const filtered = users.filter((u) => {
        const createdAt = (u as any).createdAt instanceof Date ? (u as any).createdAt : (u as any).createdAt?.toDate?.() || new Date();
        return createdAt >= startDate;
      });

      const growthByDay: Record<string, number> = {};
      filtered.forEach((u) => {
        const createdAt = (u as any).createdAt instanceof Date ? (u as any).createdAt : (u as any).createdAt?.toDate?.() || new Date();
        const dateKey = createdAt.toISOString().split('T')[0];
        if (!growthByDay[dateKey]) {
          growthByDay[dateKey] = 0;
        }
        growthByDay[dateKey] += 1;
      });

      return {
        period: {
          days,
          startDate,
          endDate: new Date(),
        },
        newUsers: filtered.length,
        growthByDay,
      };
    } catch (error) {
      this.logger.error('Error generating user growth report:', error);
      throw error;
    }
  }

  async getChurnAnalysis() {
    try {
      const subscriptions = await this.firestoreService.getAllSubscriptions({ limit: 100000 });

      const cancelled = subscriptions.filter((s) => s.status === 'cancelled');
      const active = subscriptions.filter((s) => s.status === 'active');
      const total = subscriptions.length;

      const churnRate = total > 0 ? Math.round((cancelled.length / total) * 100 * 100) / 100 : 0;

      const churnByReason: Record<string, number> = {};
      cancelled.forEach((s) => {
        const reason = s.cancelReason || 'Unknown';
        if (!churnByReason[reason]) {
          churnByReason[reason] = 0;
        }
        churnByReason[reason] += 1;
      });

      return {
        totalSubscriptions: total,
        activeSubscriptions: active.length,
        cancelledSubscriptions: cancelled.length,
        churnRate: `${churnRate}%`,
        churnByReason,
      };
    } catch (error) {
      this.logger.error('Error analyzing churn:', error);
      throw error;
    }
  }

  async getPaymentMetrics() {
    try {
      const subscriptions = await this.firestoreService.getAllSubscriptions({ limit: 100000 });

      const withAutoRenew = subscriptions.filter((s) => s.autoRenew === true).length;
      const withoutAutoRenew = subscriptions.filter((s) => s.autoRenew === false).length;

      return {
        totalSubscriptions: subscriptions.length,
        autoRenewEnabled: withAutoRenew,
        autoRenewDisabled: withoutAutoRenew,
        autoRenewPercentage: subscriptions.length > 0
          ? Math.round((withAutoRenew / subscriptions.length) * 100 * 100) / 100
          : 0,
      };
    } catch (error) {
      this.logger.error('Error getting payment metrics:', error);
      throw error;
    }
  }

  async getTopPlans() {
    try {
      const subscriptions = await this.firestoreService.getAllSubscriptions({ limit: 100000 });

      const planStats: Record<string, { count: number; revenue: number; active: number }> = {};
      subscriptions.forEach((s) => {
        if (!planStats[s.planName]) {
          planStats[s.planName] = {
            count: 0,
            revenue: 0,
            active: 0,
          };
        }
        planStats[s.planName].count += 1;
        planStats[s.planName].revenue += s.price || 0;
        if (s.status === 'active') {
          planStats[s.planName].active += 1;
        }
      });

      const topPlans = Object.entries(planStats)
        .sort((a, b) => b[1].revenue - a[1].revenue)
        .slice(0, 10)
        .map(([planName, stats]) => ({
          planName,
          ...stats,
        }));

      return topPlans;
    } catch (error) {
      this.logger.error('Error getting top plans:', error);
      throw error;
    }
  }
}
