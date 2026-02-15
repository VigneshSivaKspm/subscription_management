import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { FirestoreService } from '../firebase/firestore.service';

interface EmailTemplate {
  subject: string;
  html: string;
}

@Injectable()
export class NotificationService {
  private transporter: nodemailer.Transporter;
  private readonly logger = new Logger(NotificationService.name);
  private readonly emailFrom: string;

  constructor(
    private configService: ConfigService,
    private firestoreService: FirestoreService,
  ) {
    this.emailFrom = this.configService.get<string>('EMAIL_FROM') || 'noreply@nestmembership.com';
    this.initializeEmailService();
  }

  private initializeEmailService() {
    try {
      const emailService = this.configService.get<string>('EMAIL_SERVICE') || 'gmail';
      const emailUser = this.configService.get<string>('EMAIL_USER');
      const emailPass = this.configService.get<string>('EMAIL_PASSWORD');

      if (emailUser && emailPass) {
        this.transporter = nodemailer.createTransport({
          service: emailService,
          auth: {
            user: emailUser,
            pass: emailPass,
          },
        });
        this.logger.log('Email service initialized successfully');
      } else {
        this.logger.warn('Email credentials not configured. Email notifications will be logged only.');
      }
    } catch (error) {
      this.logger.error('Error initializing email service:', error);
    }
  }

  private getEmailTemplates() {
    return {
      welcomeEmail: (name: string, email: string): EmailTemplate => ({
        subject: 'Welcome to NestMembership',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Welcome to NestMembership, ${name}!</h2>
            <p>Thank you for joining our membership management platform.</p>
            <p>Your account has been created successfully with email: <strong>${email}</strong></p>
            <p>You can now log in to your dashboard and manage your subscriptions.</p>
            <p>If you have any questions, please contact our support team.</p>
            <hr />
            <p style="color: #666; font-size: 12px;">© 2025 NestMembership. All rights reserved.</p>
          </div>
        `,
      }),
      subscriptionActivated: (
        name: string,
        planName: string,
        price: number,
        currency: string,
        startDate: string,
      ): EmailTemplate => ({
        subject: `Your ${planName} Subscription is Active`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Subscription Activated!</h2>
            <p>Hi ${name},</p>
            <p>Your subscription to <strong>${planName}</strong> has been successfully activated.</p>
            <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <p><strong>Plan:</strong> ${planName}</p>
              <p><strong>Price:</strong> ${currency} ${price}</p>
              <p><strong>Start Date:</strong> ${startDate}</p>
            </div>
            <p>Access your dashboard to view all details and manage your subscription.</p>
            <hr />
            <p style="color: #666; font-size: 12px;">© 2025 NestMembership. All rights reserved.</p>
          </div>
        `,
      }),
      subscriptionRenewalReminder: (
        name: string,
        planName: string,
        renewalDate: string,
      ): EmailTemplate => ({
        subject: `Reminder: Your ${planName} subscription renews soon`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Subscription Renewal Reminder</h2>
            <p>Hi ${name},</p>
            <p>This is a friendly reminder that your <strong>${planName}</strong> subscription will renew on:</p>
            <p style="font-size: 18px; font-weight: bold; color: #007bff;">${renewalDate}</p>
            <p>Please ensure your payment method is up to date to avoid any interruption in service.</p>
            <p>Visit your dashboard to manage your subscription settings.</p>
            <hr />
            <p style="color: #666; font-size: 12px;">© 2025 NestMembership. All rights reserved.</p>
          </div>
        `,
      }),
      subscriptionCancelled: (name: string, planName: string): EmailTemplate => ({
        subject: `${planName} Subscription Cancelled`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Subscription Cancelled</h2>
            <p>Hi ${name},</p>
            <p>Your <strong>${planName}</strong> subscription has been cancelled as requested.</p>
            <p>You will lose access to the subscription benefits at the end of your current billing period.</p>
            <p>If you'd like to reactivate your subscription, you can do so anytime from your dashboard.</p>
            <p>If you have any feedback or concerns, please contact our support team.</p>
            <hr />
            <p style="color: #666; font-size: 12px;">© 2025 NestMembership. All rights reserved.</p>
          </div>
        `,
      }),
      invoiceGenerated: (
        name: string,
        invoiceId: string,
        amount: number,
        currency: string,
        dueDate: string,
      ): EmailTemplate => ({
        subject: `Invoice #${invoiceId} - Payment Due`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>New Invoice Generated</h2>
            <p>Hi ${name},</p>
            <p>A new invoice has been generated for your account.</p>
            <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <p><strong>Invoice ID:</strong> ${invoiceId}</p>
              <p><strong>Amount:</strong> ${currency} ${amount}</p>
              <p><strong>Due Date:</strong> ${dueDate}</p>
            </div>
            <p>Please process the payment to avoid service interruption.</p>
            <hr />
            <p style="color: #666; font-size: 12px;">© 2025 NestMembership. All rights reserved.</p>
          </div>
        `,
      }),
      paymentConfirmation: (
        name: string,
        amount: number,
        currency: string,
        transactionId: string,
        date: string,
      ): EmailTemplate => ({
        subject: `Payment Confirmation - Transaction #${transactionId}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Payment Received</h2>
            <p>Hi ${name},</p>
            <p>Thank you! We have successfully received your payment.</p>
            <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <p><strong>Transaction ID:</strong> ${transactionId}</p>
              <p><strong>Amount:</strong> ${currency} ${amount}</p>
              <p><strong>Date:</strong> ${date}</p>
            </div>
            <p>Your account has been updated and all benefits are active.</p>
            <hr />
            <p style="color: #666; font-size: 12px;">© 2025 NestMembership. All rights reserved.</p>
          </div>
        `,
      }),
      accountSuspended: (name: string, reason: string): EmailTemplate => ({
        subject: 'Account Suspended',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #d9534f;">Account Suspended</h2>
            <p>Hi ${name},</p>
            <p>Your account has been suspended due to the following reason:</p>
            <p><strong>${reason}</strong></p>
            <p>Please contact our support team immediately to resolve this issue.</p>
            <p>We will be happy to help you get back on track.</p>
            <hr />
            <p style="color: #666; font-size: 12px;">© 2025 NestMembership. All rights reserved.</p>
          </div>
        `,
      }),
      adminAlert: (subject: string, message: string): EmailTemplate => ({
        subject: `[ADMIN ALERT] ${subject}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #d9534f;">${subject}</h2>
            <p>${message}</p>
            <p>Please log in to your admin dashboard to take action.</p>
            <hr />
            <p style="color: #666; font-size: 12px;">© 2025 NestMembership. All rights reserved.</p>
          </div>
        `,
      }),
    };
  }

  async sendWelcomeEmail(email: string, name: string) {
    try {
      const template = this.getEmailTemplates().welcomeEmail(name, email);
      await this.sendEmail(email, template.subject, template.html);
      this.logger.log(`Welcome email sent to ${email}`);
    } catch (error) {
      this.logger.error(`Error sending welcome email to ${email}:`, error);
      throw error;
    }
  }

  async sendSubscriptionActivationEmail(
    email: string,
    name: string,
    planName: string,
    price: number,
    currency: string,
    startDate: Date,
  ) {
    try {
      const startDateStr = startDate.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
      const template = this.getEmailTemplates().subscriptionActivated(
        name,
        planName,
        price,
        currency,
        startDateStr,
      );
      await this.sendEmail(email, template.subject, template.html);
      this.logger.log(`Subscription activation email sent to ${email}`);
    } catch (error) {
      this.logger.error(`Error sending subscription activation email to ${email}:`, error);
      throw error;
    }
  }

  async sendSubscriptionRenewalReminder(
    email: string,
    name: string,
    planName: string,
    renewalDate: Date,
  ) {
    try {
      const renewalDateStr = renewalDate.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
      const template = this.getEmailTemplates().subscriptionRenewalReminder(
        name,
        planName,
        renewalDateStr,
      );
      await this.sendEmail(email, template.subject, template.html);
      this.logger.log(`Renewal reminder email sent to ${email}`);
    } catch (error) {
      this.logger.error(`Error sending renewal reminder email to ${email}:`, error);
      throw error;
    }
  }

  async sendSubscriptionCancellationEmail(
    email: string,
    name: string,
    planName: string,
  ) {
    try {
      const template = this.getEmailTemplates().subscriptionCancelled(name, planName);
      await this.sendEmail(email, template.subject, template.html);
      this.logger.log(`Cancellation email sent to ${email}`);
    } catch (error) {
      this.logger.error(`Error sending cancellation email to ${email}:`, error);
      throw error;
    }
  }

  async sendInvoiceEmail(
    email: string,
    name: string,
    invoiceId: string,
    amount: number,
    currency: string,
    dueDate: Date,
  ) {
    try {
      const dueDateStr = dueDate.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
      const template = this.getEmailTemplates().invoiceGenerated(
        name,
        invoiceId,
        amount,
        currency,
        dueDateStr,
      );
      await this.sendEmail(email, template.subject, template.html);
      this.logger.log(`Invoice email sent to ${email}`);
    } catch (error) {
      this.logger.error(`Error sending invoice email to ${email}:`, error);
      throw error;
    }
  }

  async sendPaymentConfirmationEmail(
    email: string,
    name: string,
    amount: number,
    currency: string,
    transactionId: string,
    date: Date,
  ) {
    try {
      const dateStr = date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
      const template = this.getEmailTemplates().paymentConfirmation(
        name,
        amount,
        currency,
        transactionId,
        dateStr,
      );
      await this.sendEmail(email, template.subject, template.html);
      this.logger.log(`Payment confirmation email sent to ${email}`);
    } catch (error) {
      this.logger.error(`Error sending payment confirmation email to ${email}:`, error);
      throw error;
    }
  }

  async sendAccountSuspensionEmail(email: string, name: string, reason: string) {
    try {
      const template = this.getEmailTemplates().accountSuspended(name, reason);
      await this.sendEmail(email, template.subject, template.html);
      this.logger.log(`Account suspension email sent to ${email}`);
    } catch (error) {
      this.logger.error(`Error sending account suspension email to ${email}:`, error);
      throw error;
    }
  }

  async sendAdminAlert(adminEmail: string, subject: string, message: string) {
    try {
      const template = this.getEmailTemplates().adminAlert(subject, message);
      await this.sendEmail(adminEmail, template.subject, template.html);
      this.logger.log(`Admin alert sent to ${adminEmail}`);
    } catch (error) {
      this.logger.error(`Error sending admin alert to ${adminEmail}:`, error);
      throw error;
    }
  }

  private async sendEmail(to: string, subject: string, html: string) {
    try {
      if (!this.transporter) {
        this.logger.warn(
          `[NO EMAIL] To: ${to}, Subject: ${subject}`,
        );
        return { queued: false, message: 'Email service not configured' };
      }

      const info = await this.transporter.sendMail({
        from: this.emailFrom,
        to,
        subject,
        html,
      });

      this.logger.log(`Email sent successfully: ${info.messageId}`);
      return { messageId: info.messageId };
    } catch (error) {
      this.logger.error(`Error sending email:`, error);
      throw error;
    }
  }

  async createInAppNotification(
    userId: string,
    title: string,
    message: string,
    type: 'info' | 'warning' | 'success' | 'error',
    actionUrl?: string,
  ) {
    try {
      await this.firestoreService.createNotification({
        userId,
        title,
        message,
        type,
        actionUrl,
      });
      this.logger.log(`In-app notification created for user: ${userId}`);
    } catch (error) {
      this.logger.error('Error creating in-app notification:', error);
      throw error;
    }
  }
}
