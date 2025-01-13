import UserModel from "@/resources/user/user-model";
import { TokenService, addEmailToQueue } from "@/utils/index";
import bcrypt from "bcryptjs";
import { IUser, RegisterUserto } from "@/resources/user/user-interface";
import { UserRoles } from "@/types/index";
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

    public async register(
        userData: RegisterUserto,
    ): Promise<{ user: Partial<IUser>; verificationToken: string }> {
        const existingUser = await this.user.findOne({ email: userData.email });
        if (existingUser) {
            throw new Conflict("Email already registered!");
        }

        const user = await this.user.create({
            ...userData,
            isEmailVerified: false,
        });

        const verificationResult = await user.generateEmailVerificationOTP();
        const { otp, verificationToken } = verificationResult;
        await user.save();

        const emailOptions = sendOTPByEmail(user as IUser, otp);
        await addEmailToQueue(emailOptions);

        const sanitizedUser: Partial<IUser> = {
            _id: user._id,
            name: user.name,
            email: user.email,
            isEmailVerified: user.isEmailVerified,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
        };

        return {
            user: sanitizedUser,
            verificationToken: verificationToken,
        };
    }

    public async verifyRegistrationOTP(
        userId: string,
        otp: string,
    ): Promise<IUser> {
        const user = await this.user.findOne({
            _id: userId,
            isEmailVerified: false,
            "emailVerificationOTP.expiresAt": { $gt: new Date() },
        });

        if (!user) {
            throw new BadRequest("Invalid or expired verification session");
        }

        if (!user?.emailVerificationOTP?.otp) {
            throw new BadRequest("No OTP found for this user");
        }

        if (new Date() > user.emailVerificationOTP.expiresAt) {
            throw new BadRequest("OTP has expired");
        }

        const isValid = await bcrypt.compare(
            otp,
            user.emailVerificationOTP.otp.toString(),
        );
        if (!isValid) {
            throw new BadRequest("Invalid OTP");
        }

        user.emailVerificationOTP = undefined;
        user.isEmailVerified = true;
        await user.save();

        const emailOptions = welcomeEmail(user as IUser);
        await addEmailToQueue(emailOptions);

        return user;
    }

    public async forgotPassword(email: string): Promise<string> {
        const user = await this.user.findOne({
            email: email.toLowerCase().trim(),
        });
        if (!user) {
            throw new ResourceNotFound("User not found");
        }

        const verificationResult = await user.generateEmailVerificationOTP();
        const { otp, verificationToken } = verificationResult;
        await user.save();

        const emailOptions = sendOTPByEmail(user as IUser, otp);
        await addEmailToQueue(emailOptions);

        return verificationToken;
    }

    public async verifyResetPasswordOTP(
        verificationToken: string,
        otp: string,
    ): Promise<IUser> {
        const user = await this.user.findOne({
            "emailVerificationOTP.verificationToken": verificationToken,
            "emailVerificationOTP.expiresAt": { $gt: new Date() },
        });

        if (!user) {
            throw new BadRequest("Invalid or expired reset token");
        }

        if (!user.emailVerificationOTP?.otp) {
            throw new BadRequest("No OTP found for this user");
        }

        if (new Date() > user.emailVerificationOTP.expiresAt) {
            throw new BadRequest("OTP has expired");
        }

        const isValid = await bcrypt.compare(
            otp,
            user.emailVerificationOTP.otp.toString(),
        );
        if (!isValid) {
            throw new BadRequest("Invalid OTP");
        }

        return user;
    }

    public async resetPassword(
        verificationToken: string,
        newPassword: string,
    ): Promise<void> {
        const user = await this.user.findOne({
            "emailVerificationOTP.verificationToken": verificationToken,
            "emailVerificationOTP.expiresAt": { $gt: new Date() },
        });

        if (!user) {
            throw new BadRequest("Invalid or expired reset token");
        }

        // Add the old password to history before updating
        user.passwordHistory = user.passwordHistory ?? [];
        user.passwordHistory.push({
            password: user.password,
            changedAt: new Date(),
        });

        user.password = newPassword;
        user.emailVerificationOTP = undefined;
        await user.save();

        const emailOptions = PasswordResetEmail(user as IUser);
        await addEmailToQueue(emailOptions);
    }

    public async login(credentials: {
        email: string;
        password: string;
    }): Promise<{ user: IUser; token: string }> {
        const user = await this.user.findOne({ email: credentials.email });
        if (!user) {
            throw new ResourceNotFound("Invalid email or password");
        }

        if (!user.isEmailVerified) {
            throw new Forbidden("Verify your email before sign in.");
        }

        const isValid = await user.comparePassword(credentials.password);
        if (!isValid) {
            throw new Unauthorized("Invalid email or password");
        }

        if (!user.roles.includes(UserRoles.User)) {
            throw new Forbidden("You do not have the 'User' role.");
        }

        const token = TokenService.createAuthToken({
            userId: user._id.toString(),
            roles: user.roles,
        });

        return { user, token };
    }

    // public async getUsers(): Promise<IUser[]> {
    //     const users = await this.user
    //         .find({ deleted: false })
    //         .select("-password")
    //         .sort({ createdAt: -1 });
    //     return users;
    // }

    // public async getUserById(id: string): Promise<IUser | null> {
    //     const user = await this.user
    //         .findOne({ _id: id, deleted: false })
    //         .select("-password");
    //     return user;
    // }

    // public async updateUserById(
    //     id: string,
    //     data: Partial<IUser>,
    // ): Promise<IUser | null> {
    //     const user = await this.user.findOneAndUpdate(
    //         { _id: id, deleted: false },
    //         { $set: data },
    //         { new: true },
    //     );

    //     return user;
    // }
}
