export class WebhookLog {
  id?: string;
  eventType: string;
  payload: string;
  errorMessage?: string | null;
  createdAt: Date;

  constructor(
    data: Partial<WebhookLog> = {},
  ) {
    this.eventType = data.eventType || '';
    this.payload = data.payload || '';
    this.errorMessage = data.errorMessage || null;
    this.createdAt = data.createdAt || new Date();
  }
}
