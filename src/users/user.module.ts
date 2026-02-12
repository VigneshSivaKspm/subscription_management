import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { PaymentsModule } from '../payments/payments.module';
import { FirebaseModule } from '../firebase/firebase.module';

@Module({
  imports: [FirebaseModule, PaymentsModule],
  providers: [UserService],
  controllers: [UserController],
  exports: [UserService],
})
export class UserModule {}
