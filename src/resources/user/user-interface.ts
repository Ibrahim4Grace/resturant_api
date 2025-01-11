import { Document } from "mongoose";

export interface IUser extends Document {
    _id: string;
    id: string;
    name: string;
    email: string;
    password: string;
    role: string;
    image: { imageId?: string; imageUrl?: string };
    isEmailVerified: boolean;
    googleId?: string;
    createdAt: Date;
    updatedAt: Date;
    passwordResetToken?: string;
    passwordResetExpires?: Date;
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

export interface RegisterUserto {
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
