export interface Invoice {
  id: string;
  userId: string;
  subscriptionId: string;
  amount: number;
  currency: string;
  status: 'pending' | 'paid' | 'failed' | 'cancelled';
  invoiceNumber?: string;
  description?: string;
  dueDate?: Date;
  paidAt?: Date;
  createdAt: Date;
  updatedAt?: Date;
}

export class InvoiceEntity implements Invoice {
  id: string;
  userId: string;
  subscriptionId: string;
  amount: number;
  currency: string;
  status: 'pending' | 'paid' | 'failed' | 'cancelled';
  invoiceNumber?: string;
  description?: string;
  dueDate?: Date;
  paidAt?: Date;
  createdAt: Date;
  updatedAt?: Date;

  constructor(data: Partial<Invoice> = {}) {
    this.id = data.id || '';
    this.userId = data.userId || '';
    this.subscriptionId = data.subscriptionId || '';
    this.amount = data.amount || 0;
    this.currency = data.currency || 'USD';
    this.status = data.status || 'pending';
    this.invoiceNumber = data.invoiceNumber;
    this.description = data.description;
    this.dueDate = data.dueDate;
    this.paidAt = data.paidAt;
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt;
  }
}
