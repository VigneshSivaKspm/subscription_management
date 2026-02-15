export interface Subscription {
  id: string;
  userId: string;
  planId: string;
  planName: string;
  price: number;
  currency: string;
  billingCycle: 'monthly' | 'quarterly' | 'yearly';
  status: 'active' | 'cancelled' | 'expired' | 'paused' | 'pending';
  startDate: Date;
  endDate: Date;
  renewalDate: Date;
  autoRenew: boolean;
  paymentMethodId?: string;
  invoiceId?: string;
  notes?: string;
  cancelledAt?: Date;
  cancelReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface SubscriptionWithUser extends Subscription {
  userEmail: string;
  userName: string;
}
