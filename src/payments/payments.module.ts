import { Module } from '@nestjs/common';
import { WebhookLogService } from './webhook-log.service';
import { FirebaseModule } from '../firebase/firebase.module';
// import { StripeModule } from './stripe.module'; // Stripe not used in this project
// import { WebhookController } from './webhook.controller'; // Stripe webhooks not needed
// import { CheckoutController } from './checkout.controller'; // Stripe checkout not needed

@Module({
  imports: [FirebaseModule], // StripeModule removed since not using Stripe
  controllers: [], // WebhookController, CheckoutController removed
  providers: [WebhookLogService],
  exports: [],
})
export class PaymentsModule {}
