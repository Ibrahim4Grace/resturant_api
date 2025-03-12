import { Document } from 'mongoose';
import { UserRole } from '../../types/index';

export interface IRider extends Document {
    _id: string;
    id: string;
    name: string;
    email: string;
    password: string;
    role: UserRole;
    address?: Address;
    phone: string;
    vehicleType?: string;
    vehicleNumber?: string;
    licenseImage: { imageId?: string; imageUrl?: string };
    currentLocation: Location;
    image?: ImageInfo;
    status?: 'available' | 'busy' | 'offline';
    rating?: number;
    bankInfo?: BankInfo;
    isEmailVerified: boolean;
    isLocked: boolean;
    failedLoginAttempts: number;
    googleId?: string;
    lastPasswordChange?: Date;
    emailVerificationOTP?: emailVerificationOTP;
    passwordHistory?: IPasswordHistoryEntry[];
    createdAt: Date;
    updatedAt: Date;

    comparePassword(password: string): Promise<boolean>;
    generateEmailVerificationOTP(): Promise<{
        otp: string;
        verificationToken: string;
    }>;
}

export interface Address {
    street: string;
    city: string;
    state: string;
}
export interface ImageInfo {
    imageId: string;
    imageUrl: string;
}

export interface Location {
    coordinates: {
        latitude: number;
        longitude: number;
    };
    lastUpdated: Date;
}

export interface BankInfo {
    account_number: String;
    bank_code: String;
    account_name: String;
    recipientCode: String;
}

export interface IPasswordHistoryEntry {
    password: string;
    changedAt: Date;
}

export interface RegisterRiderto {
    name: string;
    email: string;
    password: string;
    phone: string;
    address: Address;
    licenseImage?: { imageId: string; imageUrl: string };
}

export interface emailVerificationOTP {
    otp: String;
    expiresAt: Date;
    verificationToken: String;
}
export interface loginResponse {
    rider: Partial<IRider>;
    token: string;
}

export interface UpdateOrderStatusParams {
    riderId: string;
    orderId: string;
    status: string;
}
