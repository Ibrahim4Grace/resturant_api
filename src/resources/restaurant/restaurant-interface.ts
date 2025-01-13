import { Document } from "mongoose";
import { UserRole } from "@/types/index";

export interface IRestaurant extends Document {
    _id: string;
    id: string;
    name: string;
    email: string;
    address: address;
    businessLicense?: string;
    cuisine: string[];
    operatingHours?: operatingHours;
    deliveryRadius: number;
    rating?: number;
    status: "active" | "inactive" | "suspended";
    bankInfo?: {
        accountNumber?: string;
        bankName?: string;
        accountHolder?: string;
    };
    password: string;
    roles: UserRole[];
    image: { imageId?: string; imageUrl?: string };
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

export interface RegisterRestaurantto {
    name: string;
    email: string;
    password: string;
    role?: string;
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

export interface address {
    street?: string;
    city?: string;
    state?: string;
    coordinates?: {
        latitude?: number;
        longitude?: number;
    };
}
