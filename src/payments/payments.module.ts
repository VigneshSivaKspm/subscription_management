import { Module } from '@nestjs/common';
import { CheckoutController } from './checkout.controller';
import { WebhookController } from './webhook.controller';
import { StripeService } from './stripe.service';
import { WebhookLogService } from './webhook-log.service';
import { FirebaseModule } from '../firebase/firebase.module';

@Module({
  imports: [FirebaseModule],
  providers: [StripeService, WebhookLogService],
  controllers: [CheckoutController, WebhookController],
  exports: [StripeService],
})
export class PaymentsModule {}
