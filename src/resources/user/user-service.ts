import UserModel from "@/resources/user/user-model";
import { createToken, addEmailToQueue } from "@/utils/index";
import { IUser } from "@/resources/user/user-interface";
import bcrypt from "bcryptjs";
import { UserRole } from "@/enums/userRoles";
import {
    sendOTPByEmail,
    welcomeEmail,
    PasswordResetEmail,
} from "@/resources/user/user-email-template";
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
    }): Promise<{ user: Partial<IUser>; verificationToken: string }> {
        const existingUser = await this.user.findOne({ email: userData.email });
        if (existingUser) {
            throw new Conflict("Email already registered!");
        }

        const user = await this.user.create({
            ...userData,
            role: userData.role || "user",
            isEmailVerified: false,
        });

        const otp = await user.generateOTP();
        await user.save();

        const emailOptions = sendOTPByEmail(user as IUser, otp);
        await addEmailToQueue(emailOptions);

        const sanitizedUser: Partial<IUser> = {
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            isEmailVerified: user.isEmailVerified,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
        };

        return {
            user: sanitizedUser,
            verificationToken: user.otpData?.verificationToken || "",
        };
    }

    public async verifyRegistrationOTP(
        userId: string,
        code: string,
    ): Promise<IUser> {
        const user = await this.user.findOne({
            _id: userId,
            isEmailVerified: false,
            "otpData.verificationToken": { $exists: true },
            "otpData.expiresAt": { $gt: new Date() },
        });

        if (!user) {
            throw new BadRequest("Invalid or expired verification session");
        }

        if (!user?.otpData?.code) {
            throw new BadRequest("No OTP found for this user");
        }

        const isValid = await bcrypt.compare(code, user.otpData.code);
        if (!isValid) {
            throw new BadRequest("Invalid OTP");
        }

        user.otpData = undefined;
        user.isEmailVerified = true;
        await user.save();

        const emailOptions = welcomeEmail(user as IUser);
        await addEmailToQueue(emailOptions);

        return user;
    }

    public async handleForgotPassword(email: string): Promise<string> {
        const user = await this.user.findOne({
            email: email.toLowerCase().trim(),
        });
        if (!user) {
            throw new ResourceNotFound("User not found");
        }

        const otp = await user.generateOTP();
        const resetToken = user.generatePasswordResetToken();
        await user.save();

        const emailOptions = sendOTPByEmail(user as IUser, otp);

        await addEmailToQueue(emailOptions);

        return resetToken;
    }

    public async verifyOTP(resetToken: string, otp: string): Promise<IUser> {
        const user = await this.user.findOne({
            passwordResetToken: resetToken,
            passwordResetExpires: { $gt: new Date() },
        });

        if (!user) {
            throw new BadRequest("Invalid or expired reset token");
        }

        if (!user?.otpData?.code) {
            throw new BadRequest("No OTP found for this user");
        }

        if (new Date() > user.otpData.expiresAt) {
            throw new BadRequest("OTP has expired");
        }

        const isValid = await bcrypt.compare(otp, user.otpData.code);
        if (!isValid) {
            throw new BadRequest("Invalid OTP");
        }

        // Clear OTP and reset token data, mark email as verified
        user.otpData = undefined;
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;
        user.isEmailVerified = true;
        await user.save();

        return user;
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

        await PasswordResetEmail(user as IUser);
    }

    public async login(credentials: {
        email: string;
        password: string;
    }): Promise<{ user: IUser; token: string }> {
        const user = await this.user.findOne({ email: credentials.email });
        if (!user) {
            throw new ResourceNotFound("Invalid email or password");
        }

        const isValid = await user.comparePassword(credentials.password);
        if (!isValid) {
            throw new Error("Invalid email or password");
        }

        const token = createToken({
            userId: user._id.toString(),
            role: user.role as UserRole, // Ensure role is cast to UserRole
        });

        return { user, token: token };
    }

    public async getUsers(): Promise<IUser[]> {
        const users = await this.user
            .find({ deleted: false })
            .select("-password")
            .sort({ createdAt: -1 });
        return users;
    }

    public async getUserById(id: string): Promise<IUser | null> {
        const user = await this.user
            .findOne({ _id: id, deleted: false })
            .select("-password");
        return user;
    }

    public async updateUserById(
        id: string,
        data: Partial<IUser>,
    ): Promise<IUser | null> {
        const user = await this.user.findOneAndUpdate(
            { _id: id, deleted: false },
            { $set: data },
            { new: true },
        );

        return user;
    }
}
