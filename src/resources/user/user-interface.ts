import { Document } from "mongoose";
import { UserRole } from "@/types/index";

export interface IUser extends Document {
    _id: string;
    id: string;
    name: string;
    email: string;
    password: string;
    isLocked: boolean;
    failedLoginAttempts: number;
    roles: UserRole[];
    addresses?: Address[];
    paymentMethods?: paymentMethods;
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

export interface Address {
    _id?: string;
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
    roles?: UserRole[];
}

export interface emailVerificationOTP {
    otp: String;
    expiresAt: Date;
    verificationToken: String;
}
