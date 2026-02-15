import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as admin from 'firebase-admin';
import { v4 as uuid } from 'uuid';
import { User } from '../users/user.entity';
import { Subscription } from '../subscriptions/subscription.entity';
import { SubscriptionPlan } from '../subscriptions/subscription-plan.entity';

@Injectable()
export class FirestoreService implements OnModuleInit {
  private db: admin.firestore.Firestore;
  private readonly logger = new Logger(FirestoreService.name);

  constructor(private configService: ConfigService) {}

  onModuleInit() {
    this.initializeFirestore();
  }

  private initializeFirestore() {
    try {
      const projectId = this.configService.get<string>('FIREBASE_PROJECT_ID');
      const apiKey = this.configService.get<string>('FIREBASE_API_KEY');

      if (!projectId || !apiKey) {
        throw new Error('Missing Firebase credentials');
      }

      // Initialize Firebase Admin SDK with REST API credentials
      if (!admin.apps.length) {
        admin.initializeApp({
          projectId,
        });
      }

      this.db = admin.firestore();
      this.logger.log('Firestore initialized successfully');
    } catch (error) {
      this.logger.error('Firestore initialization error:', error);
      throw error;
    }
  }

  // ==================== Users Collection ====================
  async createUser(userData: {
    uid: string;
    email: string;
    name: string;
    surname: string;
    role: 'admin' | 'user';
    dateOfBirth?: string;
    gender?: string;
  }) {
    try {
      const docRef = this.db.collection('users').doc(userData.uid);
      const userDoc = {
        uid: userData.uid,
        email: userData.email,
        name: userData.name,
        surname: userData.surname,
        role: userData.role,
        dateOfBirth: userData.dateOfBirth || null,
        gender: userData.gender || null,
        status: 'active',
        createdAt: admin.firestore.Timestamp.now(),
        updatedAt: admin.firestore.Timestamp.now(),
        lastLogin: null,
        profileImage: null,
        phone: null,
        address: null,
        city: null,
        country: null,
      };
      await docRef.set(userDoc);
      this.logger.log(`User created: ${userData.email}`);
      return { id: userData.uid, ...userDoc };
    } catch (error) {
      this.logger.error('Error creating user:', error);
      throw error;
    }
  }

  async getUser(uid: string): Promise<(User & { id: string }) | null> {
    try {
      const doc = await this.db.collection('users').doc(uid).get();
      if (!doc.exists) {
        return null;
      }
      return { id: doc.id, ...doc.data() } as User & { id: string };
    } catch (error) {
      this.logger.error('Error getting user:', error);
      throw error;
    }
  }

  async getUserByEmail(email: string): Promise<(User & { id: string }) | null> {
    try {
      const query = await this.db
        .collection('users')
        .where('email', '==', email)
        .limit(1)
        .get();
      if (query.empty) {
        return null;
      }
      const doc = query.docs[0];
      return { id: doc.id, ...doc.data() } as User & { id: string };
    } catch (error) {
      this.logger.error('Error getting user by email:', error);
      throw error;
    }
  }

  async getAllUsers(filters?: { role?: string; status?: string; limit?: number }): Promise<(User & { id: string })[]> {
    try {
      let query: admin.firestore.Query = this.db.collection('users');

      if (filters?.role) {
        query = query.where('role', '==', filters.role);
      }

      if (filters?.status) {
        query = query.where('status', '==', filters.status);
      }

      query = query.orderBy('createdAt', 'desc').limit(filters?.limit || 100);

      const snapshot = await query.get();
      return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as User & { id: string }));
    } catch (error) {
      this.logger.error('Error getting all users:', error);
      throw error;
    }
  }

  async updateUser(uid: string, updates: Record<string, any>) {
    try {
      await this.db
        .collection('users')
        .doc(uid)
        .update({
          ...updates,
          updatedAt: admin.firestore.Timestamp.now(),
        });
      this.logger.log(`User updated: ${uid}`);
      return this.getUser(uid);
    } catch (error) {
      this.logger.error('Error updating user:', error);
      throw error;
    }
  }

  async deleteUser(uid: string) {
    try {
      await this.db.collection('users').doc(uid).delete();
      this.logger.log(`User deleted: ${uid}`);
      return { success: true };
    } catch (error) {
      this.logger.error('Error deleting user:', error);
      throw error;
    }
  }

  // ==================== Subscription Plans ====================
  async createSubscriptionPlan(planData: {
    name: string;
    description: string;
    price: number;
    currency: string;
    billingCycle: 'monthly' | 'quarterly' | 'yearly';
    features: string[];
    maxUsers?: number;
    isActive?: boolean;
  }) {
    try {
      const planId = uuid();
      const planDoc = {
        planId,
        name: planData.name,
        description: planData.description,
        price: planData.price,
        currency: planData.currency,
        billingCycle: planData.billingCycle,
        features: planData.features,
        maxUsers: planData.maxUsers || null,
        isActive: planData.isActive ?? true,
        createdAt: admin.firestore.Timestamp.now(),
        updatedAt: admin.firestore.Timestamp.now(),
      };
      await this.db.collection('subscriptionPlans').doc(planId).set(planDoc);
      this.logger.log(`Subscription plan created: ${planData.name}`);
      return { id: planId, ...planDoc };
    } catch (error) {
      this.logger.error('Error creating subscription plan:', error);
      throw error;
    }
  }

  async getSubscriptionPlan(planId: string): Promise<(SubscriptionPlan & { id: string }) | null> {
    try {
      const doc = await this.db.collection('subscriptionPlans').doc(planId).get();
      if (!doc.exists) {
        return null;
      }
      return { id: doc.id, ...doc.data() } as SubscriptionPlan & { id: string };
    } catch (error) {
      this.logger.error('Error getting subscription plan:', error);
      throw error;
    }
  }

  async getAllSubscriptionPlans(activeOnly = true): Promise<(SubscriptionPlan & { id: string })[]> {
    try {
      let query: admin.firestore.Query = this.db.collection('subscriptionPlans');

      if (activeOnly) {
        query = query.where('isActive', '==', true);
      }

      query = query.orderBy('price', 'asc');

      const snapshot = await query.get();
      return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as SubscriptionPlan & { id: string }));
    } catch (error) {
      this.logger.error('Error getting subscription plans:', error);
      throw error;
    }
  }

  async updateSubscriptionPlan(planId: string, updates: Record<string, any>) {
    try {
      await this.db
        .collection('subscriptionPlans')
        .doc(planId)
        .update({
          ...updates,
          updatedAt: admin.firestore.Timestamp.now(),
        });
      this.logger.log(`Subscription plan updated: ${planId}`);
      return this.getSubscriptionPlan(planId);
    } catch (error) {
      this.logger.error('Error updating subscription plan:', error);
      throw error;
    }
  }

  // ==================== Subscriptions ====================
  async createSubscription(subscriptionData: {
    userId: string;
    planId: string;
    planName: string;
    price: number;
    currency: string;
    billingCycle: string;
    startDate: Date;
    endDate: Date;
    renewalDate: Date;
    autoRenew?: boolean;
    notes?: string;
  }) {
    try {
      const subscriptionId = uuid();
      const subscriptionDoc = {
        subscriptionId,
        userId: subscriptionData.userId,
        planId: subscriptionData.planId,
        planName: subscriptionData.planName,
        price: subscriptionData.price,
        currency: subscriptionData.currency,
        billingCycle: subscriptionData.billingCycle,
        status: 'active',
        startDate: admin.firestore.Timestamp.fromDate(subscriptionData.startDate),
        endDate: admin.firestore.Timestamp.fromDate(subscriptionData.endDate),
        renewalDate: admin.firestore.Timestamp.fromDate(subscriptionData.renewalDate),
        autoRenew: subscriptionData.autoRenew ?? true,
        notes: subscriptionData.notes || null,
        cancelledAt: null,
        cancelReason: null,
        createdAt: admin.firestore.Timestamp.now(),
        updatedAt: admin.firestore.Timestamp.now(),
      };
      await this.db.collection('subscriptions').doc(subscriptionId).set(subscriptionDoc);
      this.logger.log(`Subscription created: ${subscriptionId}`);
      return { id: subscriptionId, ...subscriptionDoc };
    } catch (error) {
      this.logger.error('Error creating subscription:', error);
      throw error;
    }
  }

  async getSubscription(subscriptionId: string): Promise<(Subscription & { id: string }) | null> {
    try {
      const doc = await this.db.collection('subscriptions').doc(subscriptionId).get();
      if (!doc.exists) {
        return null;
      }
      return { id: doc.id, ...doc.data() } as Subscription & { id: string };
    } catch (error) {
      this.logger.error('Error getting subscription:', error);
      throw error;
    }
  }

  async getUserSubscriptions(userId: string): Promise<(Subscription & { id: string })[]> {
    try {
      const snapshot = await this.db
        .collection('subscriptions')
        .where('userId', '==', userId)
        .orderBy('createdAt', 'desc')
        .get();
      return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Subscription & { id: string }));
    } catch (error) {
      this.logger.error('Error getting user subscriptions:', error);
      throw error;
    }
  }

  async getAllSubscriptions(filters?: {
    status?: string;
    userId?: string;
    limit?: number;
  }): Promise<(Subscription & { id: string })[]> {
    try {
      let query: admin.firestore.Query = this.db.collection('subscriptions');

      if (filters?.status) {
        query = query.where('status', '==', filters.status);
      }

      if (filters?.userId) {
        query = query.where('userId', '==', filters.userId);
      }

      query = query.orderBy('createdAt', 'desc').limit(filters?.limit || 500);

      const snapshot = await query.get();
      return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Subscription & { id: string }));
    } catch (error) {
      this.logger.error('Error getting all subscriptions:', error);
      throw error;
    }
  }

  async updateSubscription(subscriptionId: string, updates: Record<string, any>) {
    try {
      await this.db
        .collection('subscriptions')
        .doc(subscriptionId)
        .update({
          ...updates,
          updatedAt: admin.firestore.Timestamp.now(),
        });
      this.logger.log(`Subscription updated: ${subscriptionId}`);
      return this.getSubscription(subscriptionId);
    } catch (error) {
      this.logger.error('Error updating subscription:', error);
      throw error;
    }
  }

  async cancelSubscription(
    subscriptionId: string,
    cancelReason: string,
  ) {
    try {
      await this.db
        .collection('subscriptions')
        .doc(subscriptionId)
        .update({
          status: 'cancelled',
          cancelReason,
          cancelledAt: admin.firestore.Timestamp.now(),
          updatedAt: admin.firestore.Timestamp.now(),
        });
      this.logger.log(`Subscription cancelled: ${subscriptionId}`);
      return this.getSubscription(subscriptionId);
    } catch (error) {
      this.logger.error('Error cancelling subscription:', error);
      throw error;
    }
  }

  // ==================== Analytics ====================
  async recordAnalytics(analyticsData: {
    userId: string;
    event: string;
    metadata?: Record<string, any>;
  }) {
    try {
      const analyticsId = uuid();
      await this.db.collection('analytics').doc(analyticsId).set({
        analyticsId,
        userId: analyticsData.userId,
        event: analyticsData.event,
        metadata: analyticsData.metadata || {},
        timestamp: admin.firestore.Timestamp.now(),
      });
      return { id: analyticsId };
    } catch (error) {
      this.logger.error('Error recording analytics:', error);
      throw error;
    }
  }

  async getAnalyticsByUser(userId: string, limit = 100) {
    try {
      const snapshot = await this.db
        .collection('analytics')
        .where('userId', '==', userId)
        .orderBy('timestamp', 'desc')
        .limit(limit)
        .get();
      return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      this.logger.error('Error getting analytics:', error);
      throw error;
    }
  }

  async getAnalyticsReport(filters?: {
    startDate?: Date;
    endDate?: Date;
    event?: string;
  }) {
    try {
      let query: admin.firestore.Query = this.db.collection('analytics');

      if (filters?.startDate) {
        query = query.where(
          'timestamp',
          '>=',
          admin.firestore.Timestamp.fromDate(filters.startDate),
        );
      }

      if (filters?.endDate) {
        query = query.where(
          'timestamp',
          '<=',
          admin.firestore.Timestamp.fromDate(filters.endDate),
        );
      }

      if (filters?.event) {
        query = query.where('event', '==', filters.event);
      }

      const snapshot = await query.orderBy('timestamp', 'desc').get();
      return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      this.logger.error('Error getting analytics report:', error);
      throw error;
    }
  }

  // ==================== Notifications ====================
  async createNotification(notificationData: {
    userId: string;
    title: string;
    message: string;
    type: 'info' | 'warning' | 'success' | 'error';
    actionUrl?: string;
    isRead?: boolean;
  }) {
    try {
      const notificationId = uuid();
      await this.db.collection('notifications').doc(notificationId).set({
        notificationId,
        userId: notificationData.userId,
        title: notificationData.title,
        message: notificationData.message,
        type: notificationData.type,
        actionUrl: notificationData.actionUrl || null,
        isRead: notificationData.isRead ?? false,
        createdAt: admin.firestore.Timestamp.now(),
      });
      this.logger.log(`Notification created for user: ${notificationData.userId}`);
      return { id: notificationId };
    } catch (error) {
      this.logger.error('Error creating notification:', error);
      throw error;
    }
  }

  async getUserNotifications(userId: string, unreadOnly = false) {
    try {
      let query: admin.firestore.Query = this.db.collection('notifications').where(
        'userId',
        '==',
        userId,
      );

      if (unreadOnly) {
        query = query.where('isRead', '==', false);
      }

      const snapshot = await query.orderBy('createdAt', 'desc').limit(50).get();
      return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      this.logger.error('Error getting user notifications:', error);
      throw error;
    }
  }

  async markNotificationAsRead(notificationId: string) {
    try {
      await this.db.collection('notifications').doc(notificationId).update({
        isRead: true,
      });
      return { success: true };
    } catch (error) {
      this.logger.error('Error marking notification as read:', error);
      throw error;
    }
  }

  async deleteNotification(notificationId: string) {
    try {
      await this.db.collection('notifications').doc(notificationId).delete();
      return { success: true };
    } catch (error) {
      this.logger.error('Error deleting notification:', error);
      throw error;
    }
  }

  // ==================== Reminders ====================
  async createReminder(reminderData: {
    userId: string;
    title: string;
    message: string;
    dueDate: Date;
    remindBefore?: number; // in hours
    isCompleted?: boolean;
  }) {
    try {
      const reminderId = uuid();
      await this.db.collection('reminders').doc(reminderId).set({
        reminderId,
        userId: reminderData.userId,
        title: reminderData.title,
        message: reminderData.message,
        dueDate: admin.firestore.Timestamp.fromDate(reminderData.dueDate),
        remindBefore: reminderData.remindBefore || 24,
        isCompleted: reminderData.isCompleted ?? false,
        sentAt: null,
        createdAt: admin.firestore.Timestamp.now(),
      });
      this.logger.log(`Reminder created for user: ${reminderData.userId}`);
      return { id: reminderId };
    } catch (error) {
      this.logger.error('Error creating reminder:', error);
      throw error;
    }
  }

  async getPendingReminders() {
    try {
      const now = new Date();
      const futureDate = new Date(now.getTime() + 24 * 60 * 60 * 1000); // Next 24 hours

      const snapshot = await this.db
        .collection('reminders')
        .where('isCompleted', '==', false)
        .where('dueDate', '>=', admin.firestore.Timestamp.fromDate(now))
        .where('dueDate', '<=', admin.firestore.Timestamp.fromDate(futureDate))
        .where('sentAt', '==', null)
        .get();

      return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      this.logger.error('Error getting pending reminders:', error);
      throw error;
    }
  }

  async markReminderAsSent(reminderId: string) {
    try {
      await this.db.collection('reminders').doc(reminderId).update({
        sentAt: admin.firestore.Timestamp.now(),
      });
      return { success: true };
    } catch (error) {
      this.logger.error('Error marking reminder as sent:', error);
      throw error;
    }
  }

  // ==================== Invoices ====================
  async createInvoice(invoiceData: {
    userId: string;
    subscriptionId: string;
    amount: number;
    currency: string;
    dueDate: Date;
    status?: 'pending' | 'paid' | 'overdue' | 'cancelled';
    notes?: string;
  }) {
    try {
      const invoiceId = uuid();
      await this.db.collection('invoices').doc(invoiceId).set({
        invoiceId,
        userId: invoiceData.userId,
        subscriptionId: invoiceData.subscriptionId,
        amount: invoiceData.amount,
        currency: invoiceData.currency,
        dueDate: admin.firestore.Timestamp.fromDate(invoiceData.dueDate),
        status: invoiceData.status || 'pending',
        notes: invoiceData.notes || null,
        paidAt: null,
        createdAt: admin.firestore.Timestamp.now(),
      });
      this.logger.log(`Invoice created: ${invoiceId}`);
      return { id: invoiceId };
    } catch (error) {
      this.logger.error('Error creating invoice:', error);
      throw error;
    }
  }

  async getUserInvoices(userId: string, status?: string) {
    try {
      let query: admin.firestore.Query = this.db
        .collection('invoices')
        .where('userId', '==', userId);

      if (status) {
        query = query.where('status', '==', status);
      }

      const snapshot = await query.orderBy('createdAt', 'desc').get();
      return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      this.logger.error('Error getting user invoices:', error);
      throw error;
    }
  }

  async updateInvoiceStatus(invoiceId: string, status: string, paidAt?: Date) {
    try {
      await this.db
        .collection('invoices')
        .doc(invoiceId)
        .update({
          status,
          paidAt: paidAt
            ? admin.firestore.Timestamp.fromDate(paidAt)
            : admin.firestore.FieldValue.delete(),
        });
      return { success: true };
    } catch (error) {
      this.logger.error('Error updating invoice status:', error);
      throw error;
    }
  }

  // ==================== Payment Methods ====================
  async savePaymentMethod(paymentData: {
    userId: string;
    type: string;
    token: string;
    last4?: string;
    expiryMonth?: number;
    expiryYear?: number;
    isDefault?: boolean;
  }) {
    try {
      const paymentId = uuid();
      await this.db.collection('paymentMethods').doc(paymentId).set({
        paymentId,
        userId: paymentData.userId,
        type: paymentData.type,
        token: paymentData.token,
        last4: paymentData.last4 || null,
        expiryMonth: paymentData.expiryMonth || null,
        expiryYear: paymentData.expiryYear || null,
        isDefault: paymentData.isDefault ?? false,
        createdAt: admin.firestore.Timestamp.now(),
      });
      this.logger.log(`Payment method saved for user: ${paymentData.userId}`);
      return { id: paymentId };
    } catch (error) {
      this.logger.error('Error saving payment method:', error);
      throw error;
    }
  }

  async getUserPaymentMethods(userId: string) {
    try {
      const snapshot = await this.db
        .collection('paymentMethods')
        .where('userId', '==', userId)
        .orderBy('createdAt', 'desc')
        .get();
      return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      this.logger.error('Error getting payment methods:', error);
      throw error;
    }
  }

  // ==================== Utility Methods ====================
  async deleteCollection(collectionPath: string) {
    try {
      const batch = this.db.batch();
      const snapshot = await this.db.collection(collectionPath).get();
      snapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
      });
      await batch.commit();
      this.logger.log(`Collection deleted: ${collectionPath}`);
      return { success: true };
    } catch (error) {
      this.logger.error('Error deleting collection:', error);
      throw error;
    }
  }

  async getDatabase() {
    return this.db;
  }
}
