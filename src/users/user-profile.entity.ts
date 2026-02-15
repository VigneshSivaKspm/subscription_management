export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  company?: string;
  address?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  profileImageUrl?: string;
  role: 'admin' | 'user';
  status: 'active' | 'inactive' | 'suspended';
  isEmailVerified: boolean;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  totalSpent: number;
  subscriptionCount: number;
  notes?: string;
}
