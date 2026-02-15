import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class FirebaseService implements OnModuleInit {
  private apiKey: string;
  private projectId: string;
  private authDomain: string;
  private baseUrl: string;

  constructor(private configService: ConfigService) {}

  onModuleInit() {
    this.initializeFirebase();
  }

  private initializeFirebase() {
    try {
      this.apiKey = this.configService.get<string>('FIREBASE_API_KEY') || '';
      this.projectId = this.configService.get<string>('FIREBASE_PROJECT_ID') || '';
      this.authDomain = this.configService.get<string>('FIREBASE_AUTH_DOMAIN') || '';

      if (!this.apiKey || !this.projectId || !this.authDomain) {
        throw new Error(
          'Missing Firebase credentials: FIREBASE_API_KEY, FIREBASE_PROJECT_ID, FIREBASE_AUTH_DOMAIN',
        );
      }

      this.baseUrl = `https://firestore.googleapis.com/v1/projects/${this.projectId}/databases/(default)/documents`;
      console.log('Firebase initialized successfully with API key credentials');
    } catch (error) {
      console.error('Firebase initialization error:', error);
      throw error;
    }
  }

  private async firestoreRequest(
    method: string,
    path: string,
    data?: any,
  ): Promise<any> {
    try {
      const separator = path.includes('?') ? '&' : '?';
      const url = `${this.baseUrl}${path}${separator}key=${this.apiKey}`;
      const options: RequestInit = {
        method,
        headers: { 'Content-Type': 'application/json' },
      };

      if (data) {
        options.body = JSON.stringify(data);
      }

      console.log(`Firestore ${method} request to: ${path}`);
      const response = await fetch(url, options);
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error(`Firestore error (${response.status}):`, errorData);
        throw new Error(`Firestore error: ${response.statusText} - ${JSON.stringify(errorData)}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`Firestore request error:`, error);
      throw error;
    }
  }

  private async authRequest(endpoint: string, data: any): Promise<any> {
    try {
      const url = `https://identitytoolkit.googleapis.com/v1/accounts:${endpoint}?key=${this.apiKey}`;
      console.log(`Firebase Auth request to: ${endpoint}`);
      
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        console.error(`Firebase Auth error (${response.status}):`, error);
        throw new Error(error.error?.message || response.statusText);
      }

      return await response.json();
    } catch (error) {
      console.error(`Firebase auth error:`, error);
      throw error;
    }
  }

  // User operations
  async createUser(userData: {
    email: string;
    password: string;
    displayName: string;
  }) {
    try {
      // Sign up with Firebase Auth
      const authResponse = await this.authRequest('signUp', {
        email: userData.email,
        password: userData.password,
        returnSecureToken: true,
      });

      if (!authResponse.localId) {
        throw new Error('Failed to create Firebase user');
      }

      const uid = authResponse.localId;

      // Create user document in Firestore
      const userFields = {
        fields: {
          uid: { stringValue: uid },
          email: { stringValue: userData.email },
          displayName: { stringValue: userData.displayName },
          name: { stringValue: '' },
          surname: { stringValue: '' },
          role: { stringValue: 'user' },
          stripeCustomerId: { nullValue: null },
          dateOfBirth: { nullValue: null },
          gender: { nullValue: null },
          createdAt: { stringValue: new Date().toISOString() },
          updatedAt: { stringValue: new Date().toISOString() },
        },
      };

      await this.firestoreRequest('POST', `/users`, userFields);

      return {
        uid,
        email: authResponse.email || userData.email,
        displayName: userData.displayName,
      };
    } catch (error: any) {
      console.error('Create user error:', error);
      throw new Error(`Failed to create user: ${error.message}`);
    }
  }

  async getUserByEmail(email: string) {
    try {
      // Query users by email
      const response = await this.firestoreRequest(
        'GET',
        `/users?pageSize=1000`,
      );

      if (!response.documents) {
        return null;
      }

      const user = response.documents.find((doc: any) => {
        return doc.fields?.email?.stringValue === email;
      });

      if (!user) {
        return null;
      }

      return this.firestoreDocToObject(user);
    } catch (error) {
      return null;
    }
  }

  async getUserById(uid: string) {
    try {
      const response = await this.firestoreRequest('GET', `/users/${uid}`);
      return this.firestoreDocToObject(response);
    } catch (error) {
      return null;
    }
  }

  async updateUser(uid: string, updateData: any) {
    const fields: any = {};
    for (const [key, value] of Object.entries(updateData)) {
      fields[key] = { stringValue: String(value) };
    }
    fields.updatedAt = { stringValue: new Date().toISOString() };

    const payload = { fields };
    await this.firestoreRequest('PATCH', `/users/${uid}`, payload);
  }

  async getAllUsers(): Promise<any[]> {
    try {
      const response = await this.firestoreRequest('GET', `/users?pageSize=1000`);
      if (!response.documents) {
        return [];
      }
      return response.documents.map((doc: any) => this.firestoreDocToObject(doc));
    } catch (error) {
      return [];
    }
  }

  private firestoreDocToObject(doc: any): any {
    if (!doc) return null;
    const obj: any = { id: doc.name?.split('/').pop() };
    if (doc.fields) {
      for (const [key, value] of Object.entries(doc.fields)) {
        obj[key] = this.extractFirestoreValue(value);
      }
    }
    return obj;
  }

  private extractFirestoreValue(value: any): any {
    if (value.stringValue !== undefined) return value.stringValue;
    if (value.integerValue !== undefined) return parseInt(value.integerValue);
    if (value.doubleValue !== undefined) return value.doubleValue;
    if (value.booleanValue !== undefined) return value.booleanValue;
    if (value.nullValue !== undefined) return null;
    if (value.timestampValue !== undefined) return value.timestampValue;
    if (value.arrayValue !== undefined)
      return value.arrayValue.values?.map((v: any) => this.extractFirestoreValue(v)) || [];
    return value;
  }

  // Subscription operations
  async createSubscription(subscriptionData: any) {
    const fields: any = {};
    for (const [key, value] of Object.entries(subscriptionData)) {
      fields[key] = this.toFirestoreValue(value);
    }
    fields.createdAt = { stringValue: new Date().toISOString() };
    fields.updatedAt = { stringValue: new Date().toISOString() };

    const response = await this.firestoreRequest('POST', `/subscriptions`, {
      fields,
    });

    return {
      id: response.name?.split('/').pop(),
      ...subscriptionData,
    };
  }

  async getSubscriptionByUserId(uid: string): Promise<any[]> {
    try {
      const response = await this.firestoreRequest(
        'GET',
        `/subscriptions?pageSize=1000`,
      );

      if (!response.documents) {
        return [];
      }

      return response.documents
        .filter(
          (doc: any) => doc.fields?.uid?.stringValue === uid,
        )
        .map((doc: any) => this.firestoreDocToObject(doc));
    } catch (error) {
      return [];
    }
  }

  async updateSubscription(subscriptionId: string, updateData: any) {
    const fields: any = {};
    for (const [key, value] of Object.entries(updateData)) {
      fields[key] = this.toFirestoreValue(value);
    }
    fields.updatedAt = { stringValue: new Date().toISOString() };

    await this.firestoreRequest('PATCH', `/subscriptions/${subscriptionId}`, {
      fields,
    });
  }

  async getAllSubscriptions(): Promise<any[]> {
    try {
      const response = await this.firestoreRequest(
        'GET',
        `/subscriptions?pageSize=1000`,
      );

      if (!response.documents) {
        return [];
      }

      return response.documents.map((doc: any) =>
        this.firestoreDocToObject(doc),
      );
    } catch (error) {
      return [];
    }
  }

  async getSubscriptionByStripeId(subscriptionId: string): Promise<any[]> {
    try {
      const allSubscriptions = await this.getAllSubscriptions();
      return allSubscriptions.filter(
        (sub: any) => sub.subscriptionId === subscriptionId,
      );
    } catch (error) {
      return [];
    }
  }

  private toFirestoreValue(value: any): any {
    if (value === null || value === undefined) {
      return { nullValue: null };
    }
    if (typeof value === 'string') {
      return { stringValue: value };
    }
    if (typeof value === 'number') {
      return Number.isInteger(value)
        ? { integerValue: value }
        : { doubleValue: value };
    }
    if (typeof value === 'boolean') {
      return { booleanValue: value };
    }
    if (value instanceof Date) {
      return { stringValue: value.toISOString() };
    }
    if (Array.isArray(value)) {
      return {
        arrayValue: {
          values: value.map((v) => this.toFirestoreValue(v)),
        },
      };
    }
    if (typeof value === 'object') {
      return { stringValue: JSON.stringify(value) };
    }
    return { stringValue: String(value) };
  }

  // Webhook log operations
  async createWebhookLog(logData: any) {
    const fields: any = {};
    for (const [key, value] of Object.entries(logData)) {
      fields[key] = this.toFirestoreValue(value);
    }
    fields.createdAt = { stringValue: new Date().toISOString() };

    const response = await this.firestoreRequest('POST', `/webhook-logs`, {
      fields,
    });

    return {
      id: response.name?.split('/').pop(),
      ...logData,
    };
  }

  async getAllWebhookLogs(): Promise<any[]> {
    try {
      const response = await this.firestoreRequest(
        'GET',
        `/webhook-logs?pageSize=1000`,
      );

      if (!response.documents) {
        return [];
      }

      return response.documents.map((doc: any) =>
        this.firestoreDocToObject(doc),
      );
    } catch (error) {
      return [];
    }
  }

  // Auth operations
  async verifyToken(token: string) {
    try {
      const response = await this.authRequest('signInWithIdp', {
        idToken: token,
        returnSecureToken: true,
      });

      if (!response.localId) {
        throw new Error('Invalid token');
      }

      return { uid: response.localId, email: response.email };
    } catch (error) {
      throw new Error('Invalid or expired token');
    }
  }

  async signIn(email: string, password: string) {
    try {
      const response = await fetch(
        `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${this.apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email,
            password,
            returnSecureToken: true,
          }),
        },
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Invalid credentials');
      }

      const data = await response.json();
      return {
        uid: data.localId,
        email: data.email,
        idToken: data.idToken,
        refreshToken: data.refreshToken,
      };
    } catch (error) {
      throw error;
    }
  }
}
