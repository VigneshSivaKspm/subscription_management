import { Module } from '@nestjs/common';
import { WebhookLogService } from './webhook-log.service';
import { FirebaseModule } from '../firebase/firebase.module';

@Module({
  imports: [FirebaseModule],
  providers: [WebhookLogService],
  exports: [],
})
export class PaymentsModule {}
