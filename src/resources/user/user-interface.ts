import { Document } from 'mongoose';
import { UserRole } from '../../types/index';

export interface IUser extends Document {
    _id: string;
    id: string;
    name: string;
    email: string;
    password: string;
    isLocked: boolean;
    failedLoginAttempts: number;
    role: UserRole;
    addresses?: Address[];
    phone?: string;
    status?: 'active' | 'suspended';
    paymentMethods?: paymentMethods;
    image: { imageId?: string; imageUrl?: string };
    isEmailVerified: boolean;
    googleId?: string;
    createdAt: Date;
    updatedAt: Date;
    ownerId?: string;
    lastPasswordChange?: Date;
    emailVerificationOTP?: emailVerificationOTP;
    passwordHistory?: IPasswordHistoryEntry[];

    comparePassword(password: string): Promise<boolean>;
    generateEmailVerificationOTP(): Promise<{
        otp: string;
        verificationToken: string;
    }>;
}

export interface Address {
    street?: string;
    city?: string;
    state?: string;
}

export interface paymentMethods {
    type: string;
    last4: string;
    expiryDate: Date;
    isDefault: Boolean;
}
[];

export interface IPasswordHistoryEntry {
    password: string;
    changedAt: Date;
}

export interface RegisterUserto {
    name: string;
    email: string;
    password: string;
    role?: UserRole[];
    phone: string;
    addresses: Address;
}

export interface emailVerificationOTP {
    otp: String;
    expiresAt: Date;
    verificationToken: String;
}

export interface RegistrationResponse {
    user: Partial<IUser>;
    verificationToken: string;
}

export interface loginResponse {
    user: Partial<IUser>;
    token: string;
}
