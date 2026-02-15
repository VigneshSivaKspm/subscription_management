import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { FirebaseService } from './firebase.service';
import { FirestoreService } from './firestore.service';

@Module({
  imports: [ConfigModule],
  providers: [FirebaseService, FirestoreService],
  exports: [FirebaseService, FirestoreService],
})
export class FirebaseModule {}
