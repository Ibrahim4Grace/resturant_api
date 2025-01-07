import UserModel from "@/resources/user/user-model";
import { createToken, sendMail } from "@/utils/index";
import { User } from "@/resources/user/user-interface";
import {
    sendOTPByEmail,
    PasswordResetEmail,
} from "@/resources/user/user-email-template";
import bcrypt from "bcryptjs";
// import { EmailService } from "@/queues/mailer-processing";
import sendEmailTemplate from "../../views/sendEmailTemplate";

import {
    Conflict,
    ResourceNotFound,
    BadRequest,
    Forbidden,
    Unauthorized,
} from "@/middlewares/index";

export class UserService {
    private user = UserModel;

    public async register(userData: {
        name: string;
        email: string;
        password: string;
        role?: string;
    }): Promise<{ user: User; token: string }> {
        const existingUser = await this.user.findOne({ email: userData.email });
        if (existingUser) {
            throw new Conflict("Email already registered!");
        }

        const user = await this.user.create({
            ...userData,
            role: userData.role || "user",
        });

        const accessToken = createToken({ _id: user._id, role: user.role });
        return { user, token: accessToken };
    }

    public async handleForgotPassword(email: string): Promise<string> {
        const user = await this.user.findOne({
            email: email.toLowerCase().trim(),
        });
        if (!user) {
            throw new ResourceNotFound("Email not found");
        }

        const otp = await user.generateOTP();
        const resetToken = user.generatePasswordResetToken();
        await user.save();

        await sendEmailTemplate({
            to: email,
            subject: "Password Reset Request",
            templateName: "password-forget",
            variables: {
                otp: otp,
                expiryTime: 10, // minutes
            },
        });

        // const emailOptions = sendOTPByEmail(user as User, otp);
        // await sendMail(emailOptions);

        return resetToken;
    }

    public async verifyOTP(resetToken: string, otp: string): Promise<boolean> {
        const user = await this.user.findOne({
            passwordResetToken: resetToken,
            passwordResetExpires: { $gt: new Date() },
        });

        if (!user?.otpData?.code) {
            throw new BadRequest("Invalid or expired reset token");
        }

        if (new Date() > user.otpData.expiresAt) {
            throw new BadRequest("OTP has expired");
        }

        const isValid = await bcrypt.compare(otp, user.otpData.code);
        if (!isValid) {
            throw new BadRequest("Invalid OTP");
        }

        return true;
    }

    public async resetPassword(
        resetToken: string,
        newPassword: string,
    ): Promise<void> {
        const user = await this.user.findOne({
            passwordResetToken: resetToken,
            passwordResetExpires: { $gt: new Date() },
        });

        if (!user) {
            throw new BadRequest("Invalid or expired reset token");
        }

        user.password = newPassword;
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;
        user.otpData = undefined;

        await user.save();

        await PasswordResetEmail(user as User);
    }

    public async login(credentials: {
        email: string;
        password: string;
    }): Promise<{ user: User; token: string }> {
        const user = await this.user.findOne({ email: credentials.email });
        if (!user) {
            throw new ResourceNotFound("Invalid email or password");
        }

        const isValid = await user.comparePassword(credentials.password);
        if (!isValid) {
            throw new Error("Invalid email or password");
        }

        const accessToken = createToken({ _id: user._id, role: user.role });
        return { user, token: accessToken };
    }

    public async getUsers(): Promise<User[]> {
        const users = await this.user
            .find({ deleted: false })
            .select("-password")
            .sort({ createdAt: -1 });
        return users;
    }

    public async getUserById(id: string): Promise<User | null> {
        const user = await this.user
            .findOne({ _id: id, deleted: false })
            .select("-password");
        return user;
    }

    public async updateUserById(
        id: string,
        data: Partial<User>,
    ): Promise<User | null> {
        const user = await this.user.findOneAndUpdate(
            { _id: id, deleted: false },
            { $set: data },
            { new: true },
        );

        return user;
    }
}
