import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './users/user.module';
import { AdminController } from './admin/admin.controller';
import { AppController } from './app.controller';
import { RoleGuard } from './auth/role.guard';
import { SubscriptionsModule } from './subscriptions/subscriptions.module';
import { PaymentsModule } from './payments/payments.module';
import { FirebaseModule } from './firebase/firebase.module';

@Module({
  controllers: [AdminController, AppController],
  providers: [RoleGuard],
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    FirebaseModule,
    UserModule,
    AuthModule,
    SubscriptionsModule,
    PaymentsModule,
  ],
})
export class AppModule {}
