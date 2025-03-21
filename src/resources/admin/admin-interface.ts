import { Document } from 'mongoose';
import { UserRole } from '../../types/index';

export interface IAdmin extends Document {
    _id: string;
    id: string;
    name: string;
    email: string;
    password: string;
    role: UserRole;
    image: { imageId?: string; imageUrl?: string };
    isLocked: boolean;
    phone: string;
    address: Address;
    failedLoginAttempts: number;
    isEmailVerified: boolean;
    googleId?: string;
    createdAt: Date;
    updatedAt: Date;
    lastPasswordChange?: Date;
    emailVerificationOTP?: emailVerificationOTP;
    passwordHistory?: IPasswordHistoryEntry[];

    comparePassword(password: string): Promise<boolean>;
    generateEmailVerificationOTP(): Promise<{
        otp: string;
        verificationToken: string;
    }>;
}

export interface IPasswordHistoryEntry {
    password: string;
    changedAt: Date;
}

export interface RegisterAdminto {
    name: string;
    email: string;
    password: string;
    phone: string;
    role?: string;
    address: Address;
}

export interface Address {
    street: string;
    city: string;
    state: string;
}

export interface emailVerificationOTP {
    otp: String;
    expiresAt: Date;
    verificationToken: String;
}

export interface loginResponse {
    admin: Partial<IAdmin>;
    token: string;
}

export interface RegistrationResponse {
    admin: Partial<IAdmin>;
    verificationToken?: string;
}

export interface UpdateOrderStatusParams {
    riderId: string;
    orderId: string;
    status: string;
}
