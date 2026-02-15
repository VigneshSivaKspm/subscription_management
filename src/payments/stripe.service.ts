import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
// import Stripe from 'stripe'; // Stripe not used in this project
import { FirebaseService } from '../firebase/firebase.service';

// Mock event type for webhook handling
export interface WebhookEvent {
  type: string;
  data: {
    object: any;
  };
}

@Injectable()
export class StripeService {
  // private stripe: Stripe;

  constructor(
    private firebaseService: FirebaseService,
    private configService: ConfigService,
  ) {
    // Stripe is not being used in this college project
    // const stripeSecretKey = this.configService.get<string>('STRIPE_SECRET_KEY');
    // if (!stripeSecretKey) {
    //   throw new Error(
    //     'Stripe secret key is not defined in environment variables',
    //   );
    // }
    // this.stripe = new Stripe(stripeSecretKey, {
    //   apiVersion: this.configService.get<string>('STRIPE_API_VERSION') as
    //     | '2024-09-30.acacia'
    //     | undefined,
    // });
  }

  // constructEvent(payload: Buffer, sig: string | string[], secret: string) {
  //   return this.stripe.webhooks.constructEvent(payload, sig, secret);
  // }

  // All Stripe methods are disabled as Stripe is not used in this college project

  constructEvent(payload: Buffer, sig: string | string[], secret: string): WebhookEvent {
    // Stub implementation - Stripe is not actually used
    // In production, this would use Stripe's webhook signature verification
    // For now, return a mock event structure
    throw new Error('Stripe webhooks are not configured for this college project');
  }

  async createCheckoutSession(
    productId: string,
    priceId: string,
    userId: string,
  ) {
    // Stub implementation - Stripe is not actually used
    throw new Error('Stripe is not configured for this college project');
  }

  async handleCheckoutSessionCompleted(session: any) {
    // Stub implementation - Stripe is not actually used
    throw new Error('Stripe is not configured for this college project');
  }

  async handleSubscriptionRenewal(invoice: any) {
    // Stub implementation - Stripe is not actually used
    throw new Error('Stripe is not configured for this college project');
  }

  async handleSubscriptionUpdated(subscription: any) {
    // Stub implementation - Stripe is not actually used
    throw new Error('Stripe is not configured for this college project');
  }

  async handleSubscriptionDeleted(subscription: any) {
    // Stub implementation - Stripe is not actually used
    throw new Error('Stripe is not configured for this college project');
  }

  // async handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  //   const subscriptionId = session.subscription as string;
  //   const customerId = session.customer as string;

  //   if (!session.metadata || !session.metadata.userId) {
  //     throw new Error('User ID not found in session metadata');
  //   }

  //   const userId = session.metadata.userId;
  //   const user = await this.firebaseService.getUserById(userId);

  //   if (user && !user.stripeCustomerId) {
  //     await this.firebaseService.updateUser(userId, {
  //       stripeCustomerId: customerId,
  //     });
  //   }

  //   const newSubscription = {
  //     subscriptionId,
  //     customerId,
  //     status: 'active',
  //     uid: userId,
  //     startDate: new Date(),
  //   };

  //   await this.firebaseService.createSubscription(newSubscription);
  // }

  // async listProducts() {
  //   return this.stripe.products.list();
  // }

  // async listProductsAndPrices() {
  //   const products = await this.stripe.products.list({ active: true });

  //   return await Promise.all(
  //     products.data.map(async (product: any) => {
  //       const prices = await this.stripe.prices.list({
  //         product: product.id,
  //         active: true,
  //       });

  //       return {
  //         productId: product.id,
  //         name: product.name,
  //         description: product.description,
  //         prices: prices.data.map((price: any) => ({
  //           priceId: price.id,
  //           unitAmount: price.unit_amount,
  //           currency: price.currency,
  //           interval: price.recurring?.interval,
  //         })),
  //       };
  //     }),
  //   );
  // }

  // async createProductAndPrice(
  //   name: string,
  //   description: string,
  //   amount: number,
  //   currency: string,
  //   interval: 'month' | 'year',
  // ) {
  //   const product = await this.stripe.products.create({
  //     name,
  //     description,
  //   });

  //   const price = await this.stripe.prices.create({
  //     unit_amount: amount,
  //     currency,
  //     recurring: { interval },
  //     product: product.id,
  //   });

  //   return { product, price };
  // }

  // async updateProduct(
  //   productId: string,
  //   updateData: { name?: string; description?: string },
  // ) {
  //   return this.stripe.products.update(productId, updateData);
  // }

  // async createNewPriceForProduct(
  //   productId: string,
  //   amount: number,
  //   currency: string,
  //   interval: 'month' | 'year',
  // ) {
  //   return this.stripe.prices.create({
  //     unit_amount: amount,
  //     currency,
  //     recurring: { interval },
  //     product: productId,
  //   });
  // }

  // async createStripeCustomer(
  //   userEmail: string,
  //   userName: string,
  // ): Promise<string> {
  //   const customer = await this.stripe.customers.create({
  //     email: userEmail,
  //     name: userName,
  //   });
  //   return customer.id;
  // }

  // async createCheckoutSession(
  //   productId: string,
  //   priceId: string,
  //   userId: string,
  // ) {
  //   const user = await this.firebaseService.getUserById(userId);

  //   const session = await this.stripe.checkout.sessions.create({
  //     customer: user?.stripeCustomerId ?? undefined,
  //     payment_method_types: ['card'],
  //     line_items: [
  //       {
  //         price: priceId,
  //         quantity: 1,
  //       },
  //     ],
  //     mode: 'subscription',
  //     success_url:
  //       this.configService.get<string>('FRONTEND_URL') +
  //       '/checkout/success?session_id={CHECKOUT_SESSION_ID}',
  //     cancel_url:
  //       this.configService.get<string>('FRONTEND_URL') + '/checkout/cancel',
  //     metadata: { userId },
  //   });

  //   return { url: session.url };
  // }

  // async createCustomerPortalSession(
  //   customerId: string,
  //   returnUrl: string,
  // ): Promise<string> {
  //   const session = await this.stripe.billingPortal.sessions.create({
  //     customer: customerId,
  //     return_url: returnUrl,
  //   });

  //   return session.url;
  // }

  // async handleSubscriptionRenewal(invoice: Stripe.Invoice) {
  //   const subscriptionId = invoice.subscription as string;
  //   const nextBillingDate = invoice.next_payment_attempt
  //     ? new Date(invoice.next_payment_attempt * 1000)
  //     : undefined;

  //   if (subscriptionId && nextBillingDate !== undefined) {
  //     const subscriptions = await this.firebaseService.getSubscriptionByStripeId(
  //       subscriptionId,
  //     );

  //     for (const sub of subscriptions) {
  //       await this.firebaseService.updateSubscription(sub.id, {
  //         nextBillingDate,
  //       });
  //     }
  //   } else {
  //     console.error('No valid values found to update the subscription.');
  //   }
  // }

  // async handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  //   const subscriptionId = subscription.id;
  //   const status = subscription.status;
  //   const startDate = new Date(subscription.current_period_start * 1000);
  //   const currentPeriodEnd = new Date(subscription.current_period_end * 1000);
  //   const nextBillingDate =
  //     status === 'active' && subscription.current_period_end
  //       ? new Date(subscription.current_period_end * 1000)
  //       : null;

  //   const updateData: any = {
  //     status,
  //     startDate,
  //     currentPeriodEnd,
  //   };

  //   if (nextBillingDate !== null) {
  //     updateData.nextBillingDate = nextBillingDate;
  //   }

  //   const subscriptions = await this.firebaseService.getSubscriptionByStripeId(
  //     subscriptionId,
  //   );

  //   for (const sub of subscriptions) {
  //     await this.firebaseService.updateSubscription(sub.id, updateData);
  //   }
  // }

  // async handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  //   const subscriptionId = subscription.id;

  //   const subscriptions = await this.firebaseService.getSubscriptionByStripeId(
  //     subscriptionId,
  //   );

  //   for (const sub of subscriptions) {
  //     await this.firebaseService.updateSubscription(sub.id, {
  //       status: 'cancelled',
  //       cancellationDate: new Date(),
  //       cancellationReason: subscription.cancel_at_period_end
  //         ? 'User canceled at period end'
  //         : 'Immediate cancellation',
  //     });
  //   }
  // }
}

