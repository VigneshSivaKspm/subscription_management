# Firebase Setup Guide for Membership Management System

This project has been migrated from TypeORM/MySQL to Firebase for real-time database operations and authentication.

## Prerequisites

- Node.js 18+ installed
- npm or yarn package manager
- Firebase project (create one at https://console.firebase.google.com)

## Step 1: Firebase Project Setup

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Create a new project or use an existing one
3. Enable Firestore Database:
   - Go to Build > Firestore Database
   - Click "Create Database"
   - Choose your region and start in test mode (you can change rules later)

4. Enable Firebase Authentication:
   - Go to Build > Authentication
   - Click "Get Started"
   - Enable "Email/Password" authentication method

5. Get Your Service Account Key:
   - Go to Project Settings (gear icon)
   - Click "Service Accounts" tab
   - Click "Generate New Private Key"
   - Save the downloaded JSON file securely

## Step 2: Environment Variables

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Update `.env` file with your Firebase configuration:

   ```env
   FRONTEND_URL=http://localhost:3001
   APP_URL=http://localhost:5000

   # Firebase Configuration - Paste the contents of your downloaded JSON file
   FIREBASE_CONFIG={"type":"service_account","project_id":"your-project-id",...}
   FIREBASE_DATABASE_URL=https://your-project-id.firebaseio.com

   JWT_SECRET=your_random_jwt_secret_key_here
   JWT_EXPIRED=30d

   payment_method=stripe
   STRIPE_API_VERSION=2024-09-30.acacia
   STRIPE_SECRET_KEY=sk_test_...
   STRIPE_PUBLIC_KEY=pk_test_...
   STRIPE_WEBHOOK_SECRET=whsec_...
   ```

   ### Getting FIREBASE_CONFIG:
   - Open the JSON file you downloaded
   - Copy its entire contents and paste as the value for `FIREBASE_CONFIG`
   - Ensure it's properly formatted as a single-line JSON

## Step 3: Install Dependencies

```bash
npm install
```

This installs all required packages including firebase-admin and Stripe.

## Step 4: Configure Firestore Security Rules

Go to Firestore Database > Rules and update with appropriate security rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users collection - User can read/write their own data
    match /users/{userId} {
      allow read, write: if request.auth.uid == userId;
    }
    
    // Subscriptions - User can read/write their own, admin can read all
    match /subscriptions/{subscriptionId} {
      allow read, write: if request.auth.uid == resource.data.uid;
      allow read: if request.auth.token.admin == true;
    }
    
    // Webhook logs - Admin only
    match /webhook-logs/{logId} {
      allow read: if request.auth.token.admin == true;
    }
  }
}
```

## Step 5: Create Admin Users

1. Create a test admin user in Firebase Console
2. Set custom claims to mark as admin:
   - Go to Users in Authentication
   - Click on the user
   - In Custom Claims, add:
   ```json
   {
     "admin": true
   }
   ```

Or use Firebase Admin SDK:

```javascript
admin.auth().setCustomUserClaims(uid, { admin: true });
```

## Step 6: Run the Application

```bash
# Development mode with hot reload
npm run start:dev

# Production mode
npm run build
npm run start:prod
```

The application will start on port 5000 (or the port specified in your environment).

## Database Schema

### Users Collection
```javascript
{
  uid: string,              // Firebase UID
  email: string,
  displayName: string,
  name: string,
  surname: string,
  role: string,             // 'user' or 'admin'
  stripeCustomerId: string,
  dateOfBirth: Date,
  gender: string,
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

### Subscriptions Collection
```javascript
{
  uid: string,              // User ID
  subscriptionId: string,   // Stripe subscription ID
  customerId: string,       // Stripe customer ID
  status: string,           // 'active', 'paused', 'cancelled'
  startDate: Date,
  currentPeriodEnd: Date,
  nextBillingDate: Date,
  cancellationDate: Date,
  cancellationReason: string,
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

### Webhook Logs Collection
```javascript
{
  eventType: string,
  payload: string,
  errorMessage: string,
  timestamp: Timestamp
}
```

## API Endpoints

### Authentication
- `POST /auth/register` - Register new user
- `POST /auth/login` - Login user
- `GET /auth/validate` - Validate JWT token

### Users
- `GET /user/profile` - Get user profile (requires auth)
- `PUT /user/profile` - Update user profile (requires auth)
- `GET /user/subscription-portal` - Get Stripe billing portal URL (requires auth)

### Subscriptions
- `GET /subscriptions/products` - List available subscription products
- `GET /subscriptions/details` - Get user's active subscriptions (requires auth)
- `GET /subscriptions/history` - Get user's subscription history (requires auth)

### Payments
- `POST /checkout/session` - Create checkout session (requires auth)
- `GET /checkout/success` - Checkout success callback
- `GET /checkout/cancel` - Checkout cancellation callback
- `POST /webhook` - Stripe webhook handler

### Admin Routes
- `GET /admin/products` - List Stripe products (admin only)
- `POST /admin/create-product` - Create new product (admin only)
- `PUT /admin/product/:id` - Update product (admin only)
- `POST /admin/product/:id/price` - Create new product price (admin only)
- `GET /admin/users` - Get all users (admin only)
- `GET /admin/subscribed-users` - Get all subscribed users (admin only)
- `GET /admin/subscription-history/all` - Get all subscriptions (admin only)
- `GET /admin/subscription-history/:userId` - Get user's subscription history (admin only)

## Testing

### Create Test User
```bash
curl -X POST http://localhost:5000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test@123",
    "name": "Test User"
  }'
```

### Login
```bash
curl -X POST http://localhost:5000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test@123"
  }'
```

## Troubleshooting

### Firebase initialization error
- Verify `FIREBASE_CONFIG` is properly set in `.env`
- Ensure it's valid JSON
- Check Firebase project ID is correct

### Authentication fails
- Verify Firebase Authentication is enabled
- Check if user exists in Firebase Console
- Verify email/password are correct

### Firestore operations fail
- Check Firestore security rules
- Verify user has permission to access collection
- Check if collection exists in Firestore

### Stripe integration issues
- Verify Stripe keys are correct in `.env`
- Check webhook secret is correct
- Ensure Stripe is enabled in your account

## Migration from TypeORM

If migrating existing data from TypeORM:
1. Export data from MySQL
2. Transform to Firestore format
3. Import to Firestore using Firebase Console or Admin SDK

## Support

For issues:
1. Check Firebase Console for error logs
2. Review application logs in terminal
3. Verify environment variables
4. Check Firestore security rules

## Next Steps

1. Set up proper Firestore security rules for production
2. Configure Cloud Functions for automatic processes
3. Set up monitoring and logging
4. Add email notifications
5. Implement backup strategies
