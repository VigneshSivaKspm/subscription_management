import { Module } from '@nestjs/common';
import { SubscriptionsController } from './subscriptions.controller';
import { SubscriptionService } from './subscription.service';
import { UserSubscriptionService } from './user-subscription.service';
import { UserSubscriptionController } from './user-subscription.controller';
import { PaymentsModule } from '../payments/payments.module';
import { FirebaseModule } from '../firebase/firebase.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [FirebaseModule, PaymentsModule, NotificationsModule],
  controllers: [SubscriptionsController, UserSubscriptionController],
  providers: [SubscriptionService, UserSubscriptionService],
  exports: [SubscriptionService, UserSubscriptionService],
})
export class SubscriptionsModule {}
