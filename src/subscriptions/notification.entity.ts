export interface Notification {
  id: string;
  userId: string;
  subscriptionId?: string;
  type: 'subscription_renewal' | 'subscription_expired' | 'subscription_cancelled' | 'payment_failed' | 'price_change' | 'account_alert';
  title: string;
  message: string;
  data?: Record<string, any>;
  read: boolean;
  archived: boolean;
  priority: 'low' | 'medium' | 'high';
  createdAt: Date;
  readAt?: Date;
}

export interface Reminder {
  id: string;
  userId: string;
  subscriptionId: string;
  type: 'renewal_upcoming' | 'payment_due' | 'subscription_expiring' | 'custom';
  title: string;
  message: string;
  reminderDate: Date;
  isDelivered: boolean;
  deliveredAt?: Date;
  channel: 'email' | 'in-app' | 'both';
  createdAt: Date;
  updatedAt: Date;
}
