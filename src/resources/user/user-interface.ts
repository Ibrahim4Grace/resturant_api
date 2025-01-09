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
    otpData?: OTPData;

    comparePassword(password: string): Promise<boolean>;
    generateOTP(): Promise<string>;
    generatePasswordResetToken(): string;
}

export interface OTPData {
    code: string;
    expiresAt: Date;
    verificationToken: string;
}

// export interface IPasswordResetService {
//     handleForgotPassword(email: string): Promise<string>;
//     handleVerifyOTP(otp: string): Promise<string>;
//     handleResetPassword(
//         resetToken: string,
//         newPassword: string,
//     ): Promise<string>;
// }
