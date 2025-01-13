import { Document } from "mongoose";
import { UserRole } from "@/types/index";

export interface IRider extends Document {
    _id: string;
    id: string;
    name: string;
    email: string;
    password: string;
    roles: UserRole[];
    vehicleType?: string;
    vehicleNumber?: string;
    licenseNumber?: string;
    documents: documents[];
    currentLocation: Location;
    image?: ImageInfo;
    status?: string; // 'available', 'busy', 'offline'
    rating?: number;
    bankInfo?: BankInfo;
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

export interface ImageInfo {
    imageId: string;
    imageUrl: string;
}

export interface documents {
    type: string; // 'license', 'insurance', 'identity'
    url: string;
    verificationStatus: string;
}

export interface Location {
    coordinates: {
        latitude: number;
        longitude: number;
    };
    lastUpdated: Date;
}

export interface BankInfo {
    accountNumber: string;
    bankName: string;
    accountHolder: string;
}

export interface IPasswordHistoryEntry {
    password: string;
    changedAt: Date;
}

export interface RegisterRiderto {
    name: string;
    email: string;
    password: string;
    role?: string;
}

export interface emailVerificationOTP {
    otp: String;
    expiresAt: Date;
    verificationToken: String;
}
