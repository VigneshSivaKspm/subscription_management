export class Subscription {
  id?: string;
  uid: string;
  subscriptionId: string;
  customerId: string;
  status: string;
  startDate?: Date;
  currentPeriodEnd?: Date;
  nextBillingDate?: Date;
  cancellationDate?: Date;
  cancellationReason?: string;

  constructor(data: Partial<Subscription> = {}) {
    this.uid = data.uid || '';
    this.subscriptionId = data.subscriptionId || '';
    this.customerId = data.customerId || '';
    this.status = data.status || '';
    this.startDate = data.startDate;
    this.currentPeriodEnd = data.currentPeriodEnd;
    this.nextBillingDate = data.nextBillingDate;
    this.cancellationDate = data.cancellationDate;
    this.cancellationReason = data.cancellationReason;
  }
}
