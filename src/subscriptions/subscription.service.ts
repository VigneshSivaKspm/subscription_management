import { Injectable } from '@nestjs/common';
import { FirebaseService } from '../firebase/firebase.service';

@Injectable()
export class SubscriptionService {
  constructor(private firebaseService: FirebaseService) {}

  async getUserSubscriptions(userId: string): Promise<any[]> {
    const subscriptions = await this.firebaseService.getSubscriptionByUserId(userId);
    return subscriptions.filter((sub: any) => sub.status === 'active');
  }

  async findUserSubscriptionHistory(userId: string): Promise<any[]> {
    const subscriptions = await this.firebaseService.getSubscriptionByUserId(userId);
    return subscriptions.sort((a: any, b: any) => {
      const dateA = new Date(a.startDate).getTime();
      const dateB = new Date(b.startDate).getTime();
      return dateB - dateA;
    });
  }

  async findAllSubscriptions(): Promise<any[]> {
    return this.firebaseService.getAllSubscriptions();
  }

  async getUserSubscriptionHistory(userId: string): Promise<any[]> {
    return this.findUserSubscriptionHistory(userId);
  }

  async createSubscription(subscriptionData: any): Promise<any> {
    return this.firebaseService.createSubscription(subscriptionData);
  }

  async updateSubscription(subscriptionId: string, updateData: any): Promise<void> {
    await this.firebaseService.updateSubscription(subscriptionId, updateData);
  }
}
