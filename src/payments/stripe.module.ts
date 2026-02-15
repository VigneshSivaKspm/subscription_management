import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { StripeService } from './stripe.service';
import { FirebaseModule } from '../firebase/firebase.module';

@Module({
  imports: [ConfigModule, FirebaseModule],
  providers: [StripeService],
  exports: [StripeService],
})
export class StripeModule {}
