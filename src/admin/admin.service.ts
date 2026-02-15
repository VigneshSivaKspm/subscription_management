import { Injectable, BadRequestException, NotFoundException, Logger } from '@nestjs/common';
import * as admin from 'firebase-admin';
import { FirestoreService } from '../firebase/firestore.service';
import { NotificationService } from '../notifications/notification.service';

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(
    private firestoreService: FirestoreService,
    private notificationService: NotificationService,
  ) {}

  // ==================== User Management ====================
  async getAllUsers(filters?: { role?: string; status?: string; search?: string; limit?: number }) {
    try {
      let users = await this.firestoreService.getAllUsers({
        role: filters?.role,
        status: filters?.status,
        limit: filters?.limit || 100,
      });

      if (filters?.search) {
        const searchTerm = filters.search.toLowerCase();
        users = users.filter(
          (u) =>
            u.email.toLowerCase().includes(searchTerm) ||
            u.name.toLowerCase().includes(searchTerm) ||
            u.surname.toLowerCase().includes(searchTerm),
        );
      }

      return users.map(this.sanitizeUser);
    } catch (error) {
      this.logger.error('Error getting all users:', error);
      throw error;
    }
  }

  async getUserDetails(uid: string) {
    try {
      const user = await this.firestoreService.getUser(uid);
      if (!user) {
        throw new NotFoundException('User not found');
      }

      const [subscriptions, invoices] = await Promise.all([
        this.firestoreService.getUserSubscriptions(uid),
        this.firestoreService.getUserInvoices(uid),
      ]);

      return {
        ...this.sanitizeUser(user),
        subscriptions,
        invoices,
      };
    } catch (error) {
      this.logger.error('Error getting user details:', error);
      throw error;
    }
  }

  async updateUser(uid: string, updates: Record<string, any>) {
    try {
      const user = await this.firestoreService.getUser(uid);
      if (!user) {
        throw new NotFoundException('User not found');
      }

      const allowedUpdates = [
        'name',
        'surname',
        'status',
        'phone',
        'address',
        'city',
        'country',
        'dateOfBirth',
        'gender',
      ];

      const sanitizedUpdates: Record<string, any> = {};
      allowedUpdates.forEach((key) => {
        if (key in updates) {
          sanitizedUpdates[key] = updates[key];
        }
      });

      const updated = await this.firestoreService.updateUser(uid, sanitizedUpdates);
      return this.sanitizeUser(updated);
    } catch (error) {
      this.logger.error('Error updating user:', error);
      throw error;
    }
  }

  async suspendUser(uid: string, reason: string) {
    try {
      const user = await this.firestoreService.getUser(uid);
      if (!user) {
        throw new NotFoundException('User not found');
      }

      await this.firestoreService.updateUser(uid, { status: 'suspended' });

      // Send notification
      await this.notificationService.createInAppNotification(
        uid,
        'Account Suspended',
        `Your account has been suspended. Reason: ${reason}`,
        'error',
      );

      // Send email
      await this.notificationService.sendAccountSuspensionEmail(
        user.email,
        `${user.name} ${user.surname}`,
        reason,
      );

      this.logger.log(`User suspended: ${uid}`);
      return { success: true, message: 'User suspended successfully' };
    } catch (error) {
      this.logger.error('Error suspending user:', error);
      throw error;
    }
  }

  async deleteUser(uid: string) {
    try {
      const user = await this.firestoreService.getUser(uid);
      if (!user) {
        throw new NotFoundException('User not found');
      }

      // Delete all user subscriptions
      const subscriptions = await this.firestoreService.getUserSubscriptions(uid);
      for (const sub of subscriptions) {
        await this.firestoreService.updateSubscription(sub.id, { status: 'cancelled' });
      }

      // Delete user
      await this.firestoreService.deleteUser(uid);
      this.logger.log(`User deleted: ${uid}`);
      return { success: true, message: 'User deleted successfully' };
    } catch (error) {
      this.logger.error('Error deleting user:', error);
      throw error;
    }
  }

  // ==================== Subscription Management ====================
  async getAllSubscriptions(filters?: {
    status?: string;
    userId?: string;
    planId?: string;
    limit?: number;
  }) {
    try {
      const subscriptions = await this.firestoreService.getAllSubscriptions({
        status: filters?.status,
        userId: filters?.userId,
        limit: filters?.limit || 500,
      });

      if (filters?.planId) {
        return subscriptions.filter((s) => s.planId === filters.planId);
      }

      return subscriptions;
    } catch (error) {
      this.logger.error('Error getting all subscriptions:', error);
      throw error;
    }
  }

  async getSubscriptionDetails(subscriptionId: string) {
    try {
      const subscription = await this.firestoreService.getSubscription(subscriptionId);
      if (!subscription) {
        throw new NotFoundException('Subscription not found');
      }

      const [user, plan, invoices] = await Promise.all([
        this.firestoreService.getUser(subscription.userId),
        this.firestoreService.getSubscriptionPlan(subscription.planId),
        this.firestoreService.getUserInvoices(subscription.userId),
      ]);

      return {
        ...subscription,
        user: this.sanitizeUser(user),
        plan,
        invoices: invoices.filter((i) => (i as any).subscriptionId === subscriptionId),
      };
    } catch (error) {
      this.logger.error('Error getting subscription details:', error);
      throw error;
    }
  }

  async updateSubscription(subscriptionId: string, updates: Record<string, any>) {
    try {
      const subscription = await this.firestoreService.getSubscription(subscriptionId);
      if (!subscription) {
        throw new NotFoundException('Subscription not found');
      }

      const allowedUpdates = ['autoRenew', 'notes', 'renewalDate', 'endDate'];
      const sanitizedUpdates: Record<string, any> = {};
      allowedUpdates.forEach((key) => {
        if (key in updates) {
          if (key === 'renewalDate' || key === 'endDate') {
            sanitizedUpdates[key] = new Date(updates[key]);
          } else {
            sanitizedUpdates[key] = updates[key];
          }
        }
      });

      const updated = await this.firestoreService.updateSubscription(
        subscriptionId,
        sanitizedUpdates,
      );
      return updated;
    } catch (error) {
      this.logger.error('Error updating subscription:', error);
      throw error;
    }
  }

  async pauseSubscription(subscriptionId: string, reason: string) {
    try {
      const subscription = await this.firestoreService.getSubscription(subscriptionId);
      if (!subscription) {
        throw new NotFoundException('Subscription not found');
      }

      await this.firestoreService.updateSubscription(subscriptionId, {
        status: 'paused',
        notes: `Paused by admin: ${reason}`,
      });

      // Notify user
      const user = await this.firestoreService.getUser(subscription.userId);
      await this.notificationService.createInAppNotification(
        subscription.userId,
        'Subscription Paused',
        `Your ${subscription.planName} subscription has been paused: ${reason}`,
        'warning',
      );

      this.logger.log(`Subscription paused: ${subscriptionId}`);
      return { success: true, message: 'Subscription paused successfully' };
    } catch (error) {
      this.logger.error('Error pausing subscription:', error);
      throw error;
    }
  }

  async resumeSubscription(subscriptionId: string) {
    try {
      const subscription = await this.firestoreService.getSubscription(subscriptionId);
      if (!subscription) {
        throw new NotFoundException('Subscription not found');
      }

      if (subscription.status !== 'paused') {
        throw new BadRequestException('Subscription is not paused');
      }

      await this.firestoreService.updateSubscription(subscriptionId, {
        status: 'active',
      });

      // Notify user
      await this.notificationService.createInAppNotification(
        subscription.userId,
        'Subscription Resumed',
        `Your ${subscription.planName} subscription has been resumed.`,
        'success',
      );

      this.logger.log(`Subscription resumed: ${subscriptionId}`);
      return { success: true, message: 'Subscription resumed successfully' };
    } catch (error) {
      this.logger.error('Error resuming subscription:', error);
      throw error;
    }
  }

  async cancelSubscription(subscriptionId: string, reason: string) {
    try {
      const subscription = await this.firestoreService.getSubscription(subscriptionId);
      if (!subscription) {
        throw new NotFoundException('Subscription not found');
      }

      await this.firestoreService.cancelSubscription(subscriptionId, reason);

      // Notify user
      const user = await this.firestoreService.getUser(subscription.userId);
      await this.notificationService.createInAppNotification(
        subscription.userId,
        'Subscription Cancelled',
        `Your ${subscription.planName} subscription has been cancelled: ${reason}`,
        'error',
      );

      if (user) {
        await this.notificationService.sendSubscriptionCancellationEmail(
          user.email,
          `${user.name} ${user.surname}`,
          subscription.planName,
        );
      }

      this.logger.log(`Subscription cancelled: ${subscriptionId}`);
      return { success: true, message: 'Subscription cancelled successfully' };
    } catch (error) {
      this.logger.error('Error cancelling subscription:', error);
      throw error;
    }
  }

  // ==================== Subscription Plans ====================
  async getAllPlans() {
    try {
      return await this.firestoreService.getAllSubscriptionPlans(false);
    } catch (error) {
      this.logger.error('Error getting all plans:', error);
      throw error;
    }
  }

  async createPlan(planData: {
    name: string;
    description: string;
    price: number;
    currency: string;
    billingCycle: 'monthly' | 'quarterly' | 'yearly';
    features: string[];
    maxUsers?: number;
  }) {
    try {
      if (planData.price < 0) {
        throw new BadRequestException('Price cannot be negative');
      }

      const plan = await this.firestoreService.createSubscriptionPlan({
        ...planData,
        isActive: true,
      });

      this.logger.log(`Plan created: ${planData.name}`);
      return plan;
    } catch (error) {
      this.logger.error('Error creating plan:', error);
      throw error;
    }
  }

  async updatePlan(planId: string, updates: Record<string, any>) {
    try {
      const plan = await this.firestoreService.getSubscriptionPlan(planId);
      if (!plan) {
        throw new NotFoundException('Plan not found');
      }

      if (updates.price !== undefined && updates.price < 0) {
        throw new BadRequestException('Price cannot be negative');
      }

      const updated = await this.firestoreService.updateSubscriptionPlan(planId, updates);
      return updated;
    } catch (error) {
      this.logger.error('Error updating plan:', error);
      throw error;
    }
  }

  async deactivatePlan(planId: string) {
    try {
      const plan = await this.firestoreService.getSubscriptionPlan(planId);
      if (!plan) {
        throw new NotFoundException('Plan not found');
      }

      await this.firestoreService.updateSubscriptionPlan(planId, { isActive: false });
      this.logger.log(`Plan deactivated: ${planId}`);
      return { success: true, message: 'Plan deactivated successfully' };
    } catch (error) {
      this.logger.error('Error deactivating plan:', error);
      throw error;
    }
  }

  // ==================== Invoices ====================
  async getAllInvoices(filters?: { status?: string; userId?: string; limit?: number }) {
    try {
      const db = await this.firestoreService.getDatabase();
      let query: admin.firestore.Query = db.collection('invoices');

      if (filters?.status) {
        query = query.where('status', '==', filters.status) as admin.firestore.Query;
      }

      if (filters?.userId) {
        query = query.where('userId', '==', filters.userId) as admin.firestore.Query;
      }

      query = query.orderBy('createdAt', 'desc').limit(filters?.limit || 500) as admin.firestore.Query;

      const snapshot = await query.get();
      return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      this.logger.error('Error getting all invoices:', error);
      throw error;
    }
  }

  async updateInvoiceStatus(invoiceId: string, status: 'pending' | 'paid' | 'overdue' | 'cancelled') {
    try {
      await this.firestoreService.updateInvoiceStatus(
        invoiceId,
        status,
        status === 'paid' ? new Date() : undefined,
      );
      return { success: true, message: 'Invoice status updated' };
    } catch (error) {
      this.logger.error('Error updating invoice status:', error);
      throw error;
    }
  }

  // ==================== Notifications ====================
  async sendNotificationToUser(userId: string, title: string, message: string, type: string) {
    try {
      const user = await this.firestoreService.getUser(userId);
      if (!user) {
        throw new NotFoundException('User not found');
      }

      await this.notificationService.createInAppNotification(
        userId,
        title,
        message,
        type as 'info' | 'warning' | 'success' | 'error',
      );

      this.logger.log(`Notification sent to user: ${userId}`);
      return { success: true, message: 'Notification sent' };
    } catch (error) {
      this.logger.error('Error sending notification:', error);
      throw error;
    }
  }

  async sendBulkNotification(userIds: string[], title: string, message: string, type: string) {
    try {
      const failedUsers = [];

      for (const userId of userIds) {
        try {
          await this.notificationService.createInAppNotification(
            userId,
            title,
            message,
            type as 'info' | 'warning' | 'success' | 'error',
          );
        } catch (error) {
          failedUsers.push(userId);
        }
      }

      this.logger.log(`Bulk notification sent to ${userIds.length} users`);
      return {
        success: true,
        totalSent: userIds.length - failedUsers.length,
        failed: failedUsers,
      };
    } catch (error) {
      this.logger.error('Error sending bulk notification:', error);
      throw error;
    }
  }

  // ==================== Utility ====================
  private sanitizeUser(user: any) {
    const { ...sanitized } = user;
    return sanitized;
  }
}
