# NestMembership - Firebase-Based Membership Management System

A modern membership management system built with NestJS, Firebase, and Stripe integration. This application provides complete subscription management, user authentication, and payment processing.

## Features

- **🔐 User Authentication**: Firebase Authentication with email/password
- **💳 Stripe Integration**: Complete payment processing and subscription management
- **📊 Admin Dashboard**: Manage users, products, and subscription analytics
- **👥 Membership Management**: Track user subscriptions and billing cycles
- **🏢 Role-Based Access Control**: Admin and user roles with different permissions
- **📱 Responsive Design**: Works on desktop and mobile devices
- **🔄 Real-time Database**: Firebase Firestore for real-time data synchronization
- **📝 Subscription History**: Complete history of all user subscriptions
- **⚙️ Product Management**: Create and manage subscription products

## Technology Stack

- **Backend**: NestJS
- **Authentication**: Firebase Authentication
- **Database**: Firebase Firestore
- **Payments**: Stripe
- **Frontend**: HTML5, CSS3, JavaScript
- **ORM**: Firebase Admin SDK

## Project Structure

```
src/
├── admin/                 # Admin endpoints
├── auth/                  # Authentication & JWT
├── firebase/             # Firebase configuration & service
├── payments/             # Stripe payment processing
├── subscriptions/        # Subscription management
├── users/                # User management
├── types/                # TypeScript interfaces
├── app.controller.ts     # Main app controller
├── app.module.ts         # Main app module
└── main.ts              # Application entry point

public/                   # Frontend static files
├── admin-dashboard.html
├── dashboard.html
├── index.html
├── login.html
├── profile.html
├── register.html
└── success.html
```

## Installation

### Prerequisites
- Node.js 18+
- npm or yarn
- Firebase project account
- Stripe account

### Setup Steps

1. **Clone the repository**
```bash
git clone <repository-url>
cd NestMembership-master
```

2. **Install dependencies**
```bash
npm install
```

3. **Configure Firebase**
   - Follow the [Firebase Setup Guide](./FIREBASE_SETUP.md)
   - Add your Firebase credentials to `.env`

4. **Configure Stripe**
   - Add your Stripe API keys to `.env`

5. **Start the application**
```bash
# Development
npm run start:dev

# Production
npm run build
npm run start:prod
```

The application will run on `http://localhost:5000`

## Configuration

Create a `.env` file following the `.env.example` template:

```env
FRONTEND_URL=http://localhost:3001
APP_URL=http://localhost:5000
FIREBASE_CONFIG=<your-firebase-config-json>
FIREBASE_DATABASE_URL=<your-firebase-database-url>
JWT_SECRET=<your-jwt-secret>
JWT_EXPIRED=30d
STRIPE_SECRET_KEY=<your-stripe-secret>
STRIPE_PUBLIC_KEY=<your-stripe-public>
STRIPE_WEBHOOK_SECRET=<your-webhook-secret>
```

## API Documentation

### Authentication Endpoints

#### Register User
```http
POST /auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePassword123",
  "name": "John Doe"
}
```

#### Login
```http
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePassword123"
}
```
Response:
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "customToken": "...",
  "user": {
    "id": "firebase-uid",
    "email": "user@example.com",
    "name": "John Doe"
  }
}
```

#### Validate Token
```http
GET /auth/validate
Authorization: Bearer <access_token>
```

### User Endpoints

#### Get Profile
```http
GET /user/profile
Authorization: Bearer <access_token>
```

#### Update Profile
```http
PUT /user/profile
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "name": "Jane Doe",
  "surname": "Smith",
  "gender": "Female",
  "date_of_birth": "1990-01-15"
}
```

#### Get Subscription Portal
```http
GET /user/subscription-portal
Authorization: Bearer <access_token>
```

### Subscription Endpoints

#### List Products
```http
GET /subscriptions/products
```

#### Get User Subscriptions
```http
GET /subscriptions/details
Authorization: Bearer <access_token>
```

#### Get Subscription History
```http
GET /subscriptions/history
Authorization: Bearer <access_token>
```

### Payment Endpoints

#### Create Checkout Session
```http
POST /checkout/session
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "productId": "stripe-product-id",
  "priceId": "stripe-price-id"
}
```

### Admin Endpoints

All admin endpoints require bearer token with admin role:

#### Get All Users
```http
GET /admin/users
Authorization: Bearer <admin-token>
```

#### Get All Products
```http
GET /admin/products
Authorization: Bearer <admin-token>
```

#### Create Product
```http
POST /admin/create-product
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "name": "Premium Plan",
  "description": "Premium membership",
  "amount": 9999,
  "currency": "usd",
  "interval": "month"
}
```

#### Update Product
```http
PUT /admin/product/:id
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "name": "Updated Plan",
  "description": "Updated description"
}
```

#### Add Product Price
```http
POST /admin/product/:id/price
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "amount": 14999,
  "currency": "usd",
  "interval": "year"
}
```

#### Get All Subscriptions
```http
GET /admin/subscription-history/all
Authorization: Bearer <admin-token>
```

#### Get User Subscription History
```http
GET /admin/subscription-history/:userId
Authorization: Bearer <admin-token>
```

## Database Schema

### Users Collection
```javascript
{
  uid: string,                    // Firebase UID
  email: string,
  displayName: string,
  name: string,
  surname: string,
  role: string,                   // 'user' or 'admin'
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
  uid: string,                    // User UID
  subscriptionId: string,         // Stripe subscription ID
  customerId: string,             // Stripe customer ID
  status: string,                 // 'active', 'inactive', 'cancelled'
  startDate: Timestamp,
  currentPeriodEnd: Timestamp,
  nextBillingDate: Timestamp,
  cancellationDate: Timestamp,
  cancellationReason: string,
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

### Webhook Logs Collection
```javascript
{
  eventType: string,              // Stripe event type
  payload: string,                // Event data
  errorMessage: string,
  createdAt: Timestamp
}
```

## Usage Examples

### Example 1: User Registration and Subscription

```bash
# Register
curl -X POST http://localhost:5000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "SecurePass123",
    "name": "John Doe"
  }'

# Login
TOKEN=$(curl -X POST http://localhost:5000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "SecurePass123"
  }' | jq '.access_token')

# Get subscription products
curl http://localhost:5000/subscriptions/products

# Create checkout session
curl -X POST http://localhost:5000/checkout/session \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "productId": "prod_xxx",
    "priceId": "price_xxx"
  }'
```

### Example 2: Admin Product Management

```bash
# Get admin token
TOKEN=$(curl -X POST http://localhost:5000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "AdminPass123"
  }' | jq '.access_token')

# Create new product
curl -X POST http://localhost:5000/admin/create-product \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Pro Plan",
    "description": "Annual Pro subscription",
    "amount": 99999,
    "currency": "usd",
    "interval": "year"
  }'

# Get all users
curl http://localhost:5000/admin/users \
  -H "Authorization: Bearer $TOKEN"
```

## Features in Detail

### 1. Authentication
- Secure Firebase Authentication
- JWT token-based API access
- Custom claims for role management
- Email/password authentication

### 2. User Management
- User profile management
- Role-based access control
- User subscription tracking
- Profile update functionality

### 3. Subscription Management
- Multiple subscription plans
- Subscription history tracking
- Active subscription queries
- Subscription status management

### 4. Payment Processing
- Stripe integration
- Checkout session creation
- Subscription management
- Billing portal access
- Webhook handling for payment events

### 5. Admin Features
- Product management
- User management
- Price management
- Subscription analytics
- Webhook log tracking

## Security Features

- **Firebase Security Rules**: Restrict data access
- **JWT Authentication**: Token-based API security
- **Role-Based Access**: Admin and user roles
- **Environment Variables**: Sensitive data protection
- **CORS Configuration**: Cross-origin request handling
- **Stripe Webhook Verification**: Secure payment callbacks

## Development

### Running in Development Mode
```bash
npm run start:dev
```

### Building for Production
```bash
npm run build
npm run start:prod
```

### Running Tests
```bash
npm test
npm run test:e2e
```

### Code Quality
```bash
npm run lint
npm run format
```

## Troubleshooting

### Common Issues

1. **Firebase Configuration Error**
   - Verify `FIREBASE_CONFIG` is valid JSON
   - Check Firebase project exists
   - Verify service account permissions

2. **Authentication Fails**
   - Check Firebase Authentication is enabled
   - Verify email/password are correct
   - Ensure user exists

3. **Stripe Integration Issues**
   - Verify Stripe keys are correct
   - Check webhook secret
   - Ensure Stripe account is active

4. **Port Already in Use**
   ```bash
   # Change port in .env or use different port
   lsof -i :5000  # Find process using port
   kill -9 <PID>  # Kill process
   ```

## Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/your-feature`
3. Commit changes: `git commit -am 'Add new feature'`
4. Push to branch: `git push origin feature/your-feature`
5. Submit pull request

## License

This project is licensed under the UNLICENSED license.

## Support

For support and questions:
1. Check the [Firebase Setup Guide](./FIREBASE_SETUP.md)
2. Review API documentation
3. Check application logs
4. Verify environment configuration

## Changelog

### Version 1.0.0 (Firebase Migration)
- Migrated from TypeORM to Firebase
- Added Firebase Firestore integration
- Updated authentication to use Firebase Auth
- Improved real-time data synchronization
- Enhanced security with Firebase rules

## Future Enhancements

- Email notifications
- SMS notifications
- Advanced analytics
- Performance optimization
- Mobile app integration
- Social login options
- Multi-currency support
- API rate limiting
