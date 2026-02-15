import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './users/user.module';
import { AdminController } from './admin/admin.controller';
import { AdminService } from './admin/admin.service';
import { AppController } from './app.controller';
import { RoleGuard } from './auth/role.guard';
import { SubscriptionsModule } from './subscriptions/subscriptions.module';
import { PaymentsModule } from './payments/payments.module';
import { FirebaseModule } from './firebase/firebase.module';
import { NotificationsModule } from './notifications/notifications.module';
import { AnalyticsModule } from './analytics/analytics.module';

@Module({
  controllers: [AdminController, AppController],
  providers: [RoleGuard, AdminService],
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    FirebaseModule,
    NotificationsModule,
    UserModule,
    AuthModule,
    SubscriptionsModule,
    PaymentsModule,
    AnalyticsModule,
  ],
})
export class AppModule {}
