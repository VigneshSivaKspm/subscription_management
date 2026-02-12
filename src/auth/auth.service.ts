import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UserService } from '../users/user.service';
import { JwtService } from '@nestjs/jwt';
import { StripeService } from '../payments/stripe.service';
import { FirebaseService } from '../firebase/firebase.service';

@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
    private jwtService: JwtService,
    private stripeService: StripeService,
    private firebaseService: FirebaseService,
  ) {}

  async register(userData: {
    email: string;
    password: string;
    name: string;
    date_of_birth?: Date;
    gender?: string;
  }) {
    try {
      console.log('Starting registration for:', userData.email);
      
      const userRecord = await this.firebaseService.createUser({
        email: userData.email,
        password: userData.password,
        displayName: userData.name,
      });

      console.log('User created:', userRecord.uid);

      // Update additional user data
      await this.firebaseService.updateUser(userRecord.uid, {
        name: userData.name,
        surname: userData.name,
        dateOfBirth: userData.date_of_birth || null,
        gender: userData.gender || null,
      });

      console.log('User data updated');

      // Create Stripe customer
      const stripeCustomerId = await this.stripeService.createStripeCustomer(
        userRecord.email,
        userData.name,
      );

      console.log('Stripe customer created:', stripeCustomerId);

      await this.firebaseService.updateUser(userRecord.uid, {
        stripeCustomerId,
      });

      console.log('Registration complete for:', userRecord.uid);

      return {
        id: userRecord.uid,
        email: userRecord.email,
        name: userData.name,
        message: 'Registration successful',
      };
    } catch (error: any) {
      console.error('Registration error:', error);
      throw new Error(`Registration failed: ${error.message}`);
    }
  }

  async login(email: string, password: string) {
    try {
      // Firebase Auth handles password verification
      // We'll create a custom token for the user
      const user = await this.firebaseService.getUserByEmail(email);

      if (!user) {
        throw new UnauthorizedException('Invalid credentials');
      }

      // Use signIn method to verify credentials
      const authResponse = await this.firebaseService.signIn(email, password);

      // Also create a JWT token for API access
      const payload = {
        email: user.email,
        sub: user.uid,
        role: user.role,
      };
      const access_token = this.jwtService.sign(payload);

      return {
        access_token,
        idToken: authResponse.idToken,
        user: {
          id: user.uid,
          email: user.email,
          name: user.displayName,
        },
      };
    } catch (error) {
      throw new UnauthorizedException('Invalid credentials');
    }
  }

  async validateToken(user: any) {
    try {
      const currentUser = await this.userService.findUserById(
        user.userId || user.sub,
      );
      if (!currentUser) {
        throw new UnauthorizedException('User not found');
      }

      return {
        isValid: true,
        user: {
          id: currentUser.id,
          email: currentUser.email,
          name: currentUser.name,
          role: currentUser.role,
        },
      };
    } catch (error) {
      throw new UnauthorizedException('Invalid token');
    }
  }

  async verifyFirebaseToken(token: string) {
    try {
      const decodedToken = await this.firebaseService.verifyToken(token);
      return decodedToken;
    } catch (error) {
      throw new UnauthorizedException('Invalid Firebase token');
    }
  }
}

