import { Module } from '@nestjs/common';
import { SubscriptionsController } from './subscriptions.controller';
import { SubscriptionService } from './subscription.service';
import { PaymentsModule } from '../payments/payments.module';
import { FirebaseModule } from '../firebase/firebase.module';

@Module({
  imports: [FirebaseModule, PaymentsModule],
  controllers: [SubscriptionsController],
  providers: [SubscriptionService],
  exports: [SubscriptionService],
})
export class SubscriptionsModule {}
