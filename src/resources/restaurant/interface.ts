import { Types, Document } from 'mongoose';
import { UserRole } from '@/types/index';

export interface IRestaurant extends Document {
    _id: string;
    id: string;
    name: string;
    email: string;
    address: Address;
    cuisine: string[];
    operatingHours?: operatingHours;
    deliveryRadius: number;
    rating?: number;
    phone?: string;
    ownerId: Types.ObjectId;
    status: 'active' | 'pending' | 'suspended';
    bankInfo?: {
        accountNumber?: string;
        bankName?: string;
        accountHolder?: string;
    };
    password: string;
    isLocked: boolean;
    failedLoginAttempts: number;
    role: UserRole;
    businessLicense: { imageId?: string; imageUrl?: string };
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

export interface emailVerificationOTP {
    otp: String;
    expiresAt: Date;
    verificationToken: String;
    verificationTokenExpires: Date;
}

export interface operatingHours {
    day: string;
    open: string;
    close: string;
}
[];

export interface Address {
    street: string;
    city: string;
    state: string;
}

export interface RegisterRestaurantto {
    name: string;
    email: string;
    businessLicense: string;
    phone: string;
    password: string;
    address: Address;
    ownerId?: string;
    isEmailVerified?: boolean;
}

export interface RegistrationResponse {
    restaurant: Partial<IRestaurant>;
    verificationToken?: string;
}

export interface RestaurantCreationResponse {
    restaurant: Partial<IRestaurant>;
    token: string;
}

export interface ISanitizedRestaurant {
    _id: string;
    name: string;
    email: string;
    phone?: string;
    address: Address;
    cuisine: string[];
    status: 'active' | 'pending' | 'suspended';
    businessLicense: { imageId?: string; imageUrl?: string };
    operatingHours?: operatingHours;
    createdAt: Date;
    updatedAt: Date;
}
