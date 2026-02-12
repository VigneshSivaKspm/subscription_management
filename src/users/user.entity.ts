import { Exclude } from 'class-transformer';

export class User {
  uid?: string;
  email: string;
  name: string;
  surname: string;
  dateOfBirth?: Date;
  gender?: string;
  role: string;
  stripeCustomerId?: string;

  @Exclude()
  password?: string;

  createdAt?: Date;
  updatedAt?: Date;

  constructor(data: Partial<User> = {}) {
    this.uid = data.uid;
    this.email = data.email || '';
    this.name = data.name || '';
    this.surname = data.surname || '';
    this.dateOfBirth = data.dateOfBirth;
    this.gender = data.gender;
    this.role = data.role || 'user';
    this.stripeCustomerId = data.stripeCustomerId;
    this.password = data.password;
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
  }
}
