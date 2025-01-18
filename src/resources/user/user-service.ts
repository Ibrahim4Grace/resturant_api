import UserModel from "@/resources/user/user-model";
import { TokenService, addEmailToQueue } from "@/utils/index";
import bcrypt from "bcryptjs";
import { LoginCredentials } from "@/types/index";
import {
    IUser,
    RegisterUserto,
    Address,
} from "@/resources/user/user-interface";
import {
    sendOTPByEmail,
    welcomeEmail,
    PasswordResetEmail,
    newAddressAdded,
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

        const isPasswordUsedBefore = user.passwordHistory.some((entry) =>
            bcrypt.compareSync(newPassword, entry.password),
        );

        if (isPasswordUsedBefore) {
            throw new BadRequest(
                "This password has been used before. Please choose a new password.",
            );
        }

        user.passwordHistory.push({
            password: user.password,
            changedAt: new Date(),
        });

        const PASSWORD_HISTORY_LIMIT = 5;
        if (user.passwordHistory.length > PASSWORD_HISTORY_LIMIT) {
            user.passwordHistory = user.passwordHistory.slice(
                -PASSWORD_HISTORY_LIMIT,
            );
        }

        user.password = newPassword;
        user.emailVerificationOTP = undefined;
        user.failedLoginAttempts = 0;
        user.isLocked = false;
        await user.save();

        const emailOptions = PasswordResetEmail(user as IUser);
        await addEmailToQueue(emailOptions);
    }

    public async login(
        credentials: LoginCredentials,
    ): Promise<{ user: IUser; token: string }> {
        const user = await this.user.findOne({ email: credentials.email });
        if (!user) {
            throw new ResourceNotFound("Invalid email or password");
        }

        if (!user.isEmailVerified) {
            throw new Forbidden("Verify your email before sign in.");
        }

        const isValid = await user.comparePassword(credentials.password);
        if (!isValid) {
            user.failedLoginAttempts += 1;
            if (user.failedLoginAttempts >= 3) {
                user.isLocked = true;
                await user.save();
                throw new Forbidden(
                    "Your account has been locked due to multiple failed login attempts. Please reset your password.",
                );
            }
            await user.save();
            throw new Unauthorized("Invalid email or password");
        }

        user.failedLoginAttempts = 0;
        await user.save();

        // If no specific role is provided, default to 'user' role
        const requestedRole = credentials.roles || "user";
        if (!user.roles.includes(requestedRole)) {
            throw new Forbidden(
                `You do not have permission to sign in as ${requestedRole}`,
            );
        }

        const token = TokenService.createAuthToken({
            userId: user._id.toString(),
            roles: user.roles,
        });

        return { user, token };
    }

    public async getUserById(userId: string): Promise<IUser> {
        const user = await this.user
            .findById(userId)
            .select("-password -failedLoginAttempts -isLocked");

        if (!user) {
            throw new ResourceNotFound("User not found");
        }

        return user;
    }

    public async updateUserById(
        id: string,
        data: Partial<IUser>,
    ): Promise<IUser | null> {
        const user = await this.user.findOneAndUpdate(
            { _id: id },
            { $set: data },
            { new: true },
        );

        return user;
    }

    public async addNewAddress(
        userId: string,
        addressData: Address,
    ): Promise<IUser> {
        const user = await this.user.findById(userId);
        if (!user) {
            throw new ResourceNotFound("User not found");
        }

        user.addresses = user.addresses || [];
        const isDuplicate = user.addresses.some(
            (address) =>
                address.street === addressData.street &&
                address.city === addressData.city &&
                address.state === addressData.state,
        );

        if (isDuplicate) {
            throw new Conflict(
                "Duplicate address: This address already exists.",
            );
        }

        const emailOptions = newAddressAdded(user as IUser, addressData);
        await addEmailToQueue(emailOptions);

        user.addresses.push(addressData);
        await user.save();
        return user;
    }

    public async getUserAddress(userId: string): Promise<Address[]> {
        const user = await this.user
            .findById(userId)
            .select("addresses")
            .lean();

        if (!user) {
            throw new ResourceNotFound("User not found");
        }

        return user.addresses || [];
    }

    public async deleteAddress(
        userId: string,
        addressId: string,
    ): Promise<void> {
        const user = await this.user.findById(userId);
        if (!user) {
            throw new ResourceNotFound("User not found");
        }

        const result = await this.user.findOneAndUpdate(
            { _id: userId, "addresses._id": addressId },
            { $pull: { addresses: { _id: addressId } } },
            { new: true },
        );

        if (!result) {
            throw new ResourceNotFound("Address not found");
        }
    }

    // public async getUserOrders(userId: string): Promise<IOrder[]> {
    //     const orders = await this.orderModel.find({ userId });
    //     return orders;
    // }
}
