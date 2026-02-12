import { Injectable } from '@nestjs/common';
import { FirebaseService } from '../firebase/firebase.service';

@Injectable()
export class WebhookLogService {
  constructor(private firebaseService: FirebaseService) {}

  async createLog(
    eventType: string,
    payload: string,
    errorMessage: string | null = null,
  ) {
    await this.firebaseService.createWebhookLog({
      eventType,
      payload,
      errorMessage: errorMessage || null,
      timestamp: new Date(),
    });
  }

  async getAllLogs() {
    return this.firebaseService.getAllWebhookLogs();
  }
}
