import { Injectable, BadRequestException, NotFoundException, Logger } from '@nestjs/common';
import { FirestoreService } from '../firebase/firestore.service';
import { NotificationService } from '../notifications/notification.service';

@Injectable()
export class UserSubscriptionService {
  private readonly logger = new Logger(UserSubscriptionService.name);

  constructor(
    private firestoreService: FirestoreService,
    private notificationService: NotificationService,
  ) {}

  async getUserSubscriptions(userId: string) {
    try {
      return await this.firestoreService.getUserSubscriptions(userId);
    } catch (error) {
      this.logger.error('Error getting user subscriptions:', error);
      throw error;
    }
  }

  async getSubscriptionDetails(userId: string, subscriptionId: string) {
    try {
      const subscription = await this.firestoreService.getSubscription(subscriptionId);
      if (!subscription) {
        throw new NotFoundException('Subscription not found');
      }

      if (subscription.userId !== userId) {
        throw new BadRequestException('Unauthorized');
      }

      const plan = await this.firestoreService.getSubscriptionPlan(subscription.planId);
      const invoices = await this.firestoreService.getUserInvoices(userId);

      return {
        ...subscription,
        plan,
        invoices: invoices.filter((i) => (i as any).subscriptionId === subscriptionId),
      };
    } catch (error) {
      this.logger.error('Error getting subscription details:', error);
      throw error;
    }
  }

  async renewSubscription(userId: string, subscriptionId: string) {
    try {
      const subscription = await this.firestoreService.getSubscription(subscriptionId);
      if (!subscription) {
        throw new NotFoundException('Subscription not found');
      }

      if (subscription.userId !== userId) {
        throw new BadRequestException('Unauthorized');
      }

      const today = new Date();
      const startDate = new Date(today);
      const endDate = new Date(today);

      // Calculate end date based on billing cycle
      if (subscription.billingCycle === 'monthly') {
        endDate.setMonth(endDate.getMonth() + 1);
      } else if (subscription.billingCycle === 'quarterly') {
        endDate.setMonth(endDate.getMonth() + 3);
      } else if (subscription.billingCycle === 'yearly') {
        endDate.setFullYear(endDate.getFullYear() + 1);
      }

      const renewalDate = new Date(endDate);

      const updated = await this.firestoreService.updateSubscription(subscriptionId, {
        status: 'active',
        startDate,
        endDate,
        renewalDate,
        cancelledAt: null,
        cancelReason: null,
      });

      // Create notification
      await this.notificationService.createInAppNotification(
        userId,
        'Subscription Renewed',
        `Your ${subscription.planName} subscription has been renewed successfully.`,
        'success',
      );

      // Get user for email
      const user = await this.firestoreService.getUser(userId);
      if (user) {
        await this.notificationService.sendSubscriptionActivationEmail(
          user.email,
          `${user.name} ${user.surname}`,
          subscription.planName,
          subscription.price,
          subscription.currency,
          startDate,
        );
      }

      this.logger.log(`Subscription renewed: ${subscriptionId}`);
      return updated;
    } catch (error) {
      this.logger.error('Error renewing subscription:', error);
      throw error;
    }
  }

  async cancelSubscription(userId: string, subscriptionId: string, reason: string) {
    try {
      const subscription = await this.firestoreService.getSubscription(subscriptionId);
      if (!subscription) {
        throw new NotFoundException('Subscription not found');
      }

      if (subscription.userId !== userId) {
        throw new BadRequestException('Unauthorized');
      }

      const updated = await this.firestoreService.cancelSubscription(subscriptionId, reason);

      // Create notification
      await this.notificationService.createInAppNotification(
        userId,
        'Subscription Cancelled',
        `Your ${subscription.planName} subscription has been cancelled.`,
        'warning',
      );

      // Send email
      const user = await this.firestoreService.getUser(userId);
      if (user) {
        await this.notificationService.sendSubscriptionCancellationEmail(
          user.email,
          `${user.name} ${user.surname}`,
          subscription.planName,
        );
      }

      this.logger.log(`Subscription cancelled by user: ${subscriptionId}`);
      return updated;
    } catch (error) {
      this.logger.error('Error cancelling subscription:', error);
      throw error;
    }
  }

  async pauseSubscription(userId: string, subscriptionId: string) {
    try {
      const subscription = await this.firestoreService.getSubscription(subscriptionId);
      if (!subscription) {
        throw new NotFoundException('Subscription not found');
      }

      if (subscription.userId !== userId) {
        throw new BadRequestException('Unauthorized');
      }

      const updated = await this.firestoreService.updateSubscription(subscriptionId, {
        status: 'paused',
      });

      await this.notificationService.createInAppNotification(
        userId,
        'Subscription Paused',
        `Your ${subscription.planName} subscription has been paused.`,
        'info',
      );

      this.logger.log(`Subscription paused by user: ${subscriptionId}`);
      return updated;
    } catch (error) {
      this.logger.error('Error pausing subscription:', error);
      throw error;
    }
  }

  async resumeSubscription(userId: string, subscriptionId: string) {
    try {
      const subscription = await this.firestoreService.getSubscription(subscriptionId);
      if (!subscription) {
        throw new NotFoundException('Subscription not found');
      }

      if (subscription.userId !== userId) {
        throw new BadRequestException('Unauthorized');
      }

      if (subscription.status !== 'paused') {
        throw new BadRequestException('Subscription is not paused');
      }

      const updated = await this.firestoreService.updateSubscription(subscriptionId, {
        status: 'active',
      });

      await this.notificationService.createInAppNotification(
        userId,
        'Subscription Resumed',
        `Your ${subscription.planName} subscription has been resumed.`,
        'success',
      );

      this.logger.log(`Subscription resumed by user: ${subscriptionId}`);
      return updated;
    } catch (error) {
      this.logger.error('Error resuming subscription:', error);
      throw error;
    }
  }

  async getUserInvoices(userId: string, status?: string) {
    try {
      return await this.firestoreService.getUserInvoices(userId, status);
    } catch (error) {
      this.logger.error('Error getting user invoices:', error);
      throw error;
    }
  }

  async getAvailablePlans() {
    try {
      return await this.firestoreService.getAllSubscriptionPlans(true);
    } catch (error) {
      this.logger.error('Error getting available plans:', error);
      throw error;
    }
  }

  async createSubscription(
    userId: string,
    planId: string,
    autoRenew = true,
    notes?: string,
  ) {
    try {
      const plan = await this.firestoreService.getSubscriptionPlan(planId);
      if (!plan) {
        throw new NotFoundException('Plan not found');
      }

      if (!plan.isActive) {
        throw new BadRequestException('This plan is no longer available');
      }

      const today = new Date();
      const startDate = new Date(today);
      const endDate = new Date(today);

      // Calculate end date based on billing cycle
      if (plan.billingCycle === 'monthly') {
        endDate.setMonth(endDate.getMonth() + 1);
      } else if (plan.billingCycle === 'quarterly') {
        endDate.setMonth(endDate.getMonth() + 3);
      } else if (plan.billingCycle === 'yearly') {
        endDate.setFullYear(endDate.getFullYear() + 1);
      }

      const renewalDate = new Date(endDate);

      const subscription = await this.firestoreService.createSubscription({
        userId,
        planId,
        planName: plan.name,
        price: plan.price,
        currency: plan.currency,
        billingCycle: plan.billingCycle,
        startDate,
        endDate,
        renewalDate,
        autoRenew,
        notes,
      });

      // Create notification
      await this.notificationService.createInAppNotification(
        userId,
        'Subscription Activated',
        `Your ${plan.name} subscription is now active!`,
        'success',
      );

      // Send email
      const user = await this.firestoreService.getUser(userId);
      if (user) {
        await this.notificationService.sendSubscriptionActivationEmail(
          user.email,
          `${user.name} ${user.surname}`,
          plan.name,
          plan.price,
          plan.currency,
          startDate,
        );
      }

      // Record analytics
      await this.firestoreService.recordAnalytics({
        userId,
        event: 'subscription_created',
        metadata: { planId, planName: plan.name, price: plan.price },
      });

      this.logger.log(`Subscription created: ${subscription.id}`);
      return subscription;
    } catch (error) {
      this.logger.error('Error creating subscription:', error);
      throw error;
    }
  }

  async updateAutoRenew(userId: string, subscriptionId: string, autoRenew: boolean) {
    try {
      const subscription = await this.firestoreService.getSubscription(subscriptionId);
      if (!subscription) {
        throw new NotFoundException('Subscription not found');
      }

      if (subscription.userId !== userId) {
        throw new BadRequestException('Unauthorized');
      }

      const updated = await this.firestoreService.updateSubscription(subscriptionId, {
        autoRenew,
      });

      await this.notificationService.createInAppNotification(
        userId,
        'Subscription Settings Updated',
        `Auto-renewal has been ${autoRenew ? 'enabled' : 'disabled'}.`,
        'info',
      );

      this.logger.log(`Auto-renew updated for subscription: ${subscriptionId}`);
      return updated;
    } catch (error) {
      this.logger.error('Error updating auto-renew:', error);
      throw error;
    }
  }

  async getSubscriptionSummary(userId: string) {
    try {
      const [subscriptions, invoices] = await Promise.all([
        this.getUserSubscriptions(userId),
        this.getUserInvoices(userId),
      ]);

      const activeSubscriptions = subscriptions.filter((s) => s.status === 'active');
      const cancelledSubscriptions = subscriptions.filter((s) => s.status === 'cancelled');
      const pausedSubscriptions = subscriptions.filter((s) => s.status === 'paused');

      const totalSpent = subscriptions.reduce((sum, s) => sum + (s.price || 0), 0);
      const pendingInvoices = invoices.filter((i) => (i as any).status === 'pending');
      const paidInvoices = invoices.filter((i) => (i as any).status === 'paid');

      return {
        total: subscriptions.length,
        active: activeSubscriptions.length,
        cancelled: cancelledSubscriptions.length,
        paused: pausedSubscriptions.length,
        totalSpent: Math.round(totalSpent * 100) / 100,
        pendingInvoices: pendingInvoices.length,
        paidInvoices: paidInvoices.length,
        nextRenewal: activeSubscriptions.length > 0
          ? new Date(Math.min(...activeSubscriptions.map((s) => {
              const date = s.renewalDate;
              const timestamp = date instanceof Date ? date.getTime() : (date as any)?.toDate?.().getTime?.() || 0;
              return timestamp;
            })))
          : null,
      };
    } catch (error) {
      this.logger.error('Error getting subscription summary:', error);
      throw error;
    }
  }
}
