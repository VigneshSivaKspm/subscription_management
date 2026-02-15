export interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  billingCycle: 'monthly' | 'quarterly' | 'yearly';
  features: string[];
  maxUsers?: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
