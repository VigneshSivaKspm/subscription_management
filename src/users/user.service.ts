import { Injectable } from '@nestjs/common';
import { FirebaseService } from '../firebase/firebase.service';

@Injectable()
export class UserService {
  constructor(private firebaseService: FirebaseService) {}

  async createUser(userData: Partial<any>): Promise<any> {
    try {
      const userRecord = await this.firebaseService.createUser({
        email: userData.email,
        password: userData.password,
        displayName: userData.name,
      });

      // Update additional user data
      await this.firebaseService.updateUser(userRecord.uid, {
        name: userData.name || '',
        surname: userData.surname || '',
        dateOfBirth: userData.date_of_birth || null,
        gender: userData.gender || null,
        role: userData.role || 'user',
      });

      return {
        id: userRecord.uid,
        email: userRecord.email,
        name: userData.name,
        username: userRecord.displayName,
      };
    } catch (error) {
      throw new Error(`Failed to create user: ${error.message}`);
    }
  }

  async findUserById(id: string): Promise<any> {
    const user = await this.firebaseService.getUserById(id);
    if (!user) {
      throw new Error('User not found');
    }
    return {
      id: user.uid,
      email: user.email,
      name: user.displayName,
      role: user.role,
      stripeCustomerId: user.stripeCustomerId,
    };
  }

  async findUserByEmail(email: string): Promise<any | null> {
    const user = await this.firebaseService.getUserByEmail(email);
    if (!user) {
      return null;
    }
    return {
      id: user.uid,
      email: user.email,
      name: user.displayName,
      role: user.role,
      stripeCustomerId: user.stripeCustomerId,
    };
  }

  async updateUser(userId: string, updateData: Partial<any>) {
    const mappedData: any = {};

    if (updateData.name) mappedData.name = updateData.name;
    if (updateData.surname) mappedData.surname = updateData.surname;
    if (updateData.stripeCustomerId)
      mappedData.stripeCustomerId = updateData.stripeCustomerId;
    if (updateData.dateOfBirth) mappedData.dateOfBirth = updateData.dateOfBirth;
    if (updateData.gender) mappedData.gender = updateData.gender;

    await this.firebaseService.updateUser(userId, mappedData);
  }

  async updateProfile(userId: string, updateData: Partial<any>): Promise<any> {
    await this.updateUser(userId, updateData);
    return this.findUserById(userId);
  }

  async findAllUsers(): Promise<any[]> {
    const users = await this.firebaseService.getAllUsers();
    return users.map((user) => ({
      id: user.uid || user.id,
      email: user.email,
      name: user.displayName,
      role: user.role,
    }));
  }

  async findSubscribedUsers(): Promise<any[]> {
    const subscriptions =
      await this.firebaseService.getAllSubscriptions();

    // Get unique user IDs from subscriptions
    const userIds = Array.from(new Set(subscriptions.map((s) => s.uid)));

    const subscribedUsers = await Promise.all(
      userIds.map((uid) => this.findUserById(uid as string)),
    );

    return subscribedUsers.filter((user) => user !== null);
  }
}

