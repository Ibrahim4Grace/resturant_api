import UserModel from '@/resources/user/user-model';
import OrderModel from '@/resources/order/order-model';
import { TokenService, EmailQueueService } from '@/utils/index';
import bcrypt from 'bcryptjs';
import { LoginCredentials } from '@/types/index';
import { IOrder } from '@/resources/order/order-interface';
import {
    IUser,
    RegisterUserto,
    Address,
    RegistrationResponse,
    loginResponse,
} from '@/resources/user/user-interface';
import {
    sendOTPByEmail,
    welcomeEmail,
    PasswordResetEmail,
    newAddressAdded,
} from '@/resources/user/user-email-template';
import {
    Conflict,
    ResourceNotFound,
    BadRequest,
    Forbidden,
    Unauthorized,
} from '@/middlewares/index';

export class UserService {
    private user = UserModel;
    private order = OrderModel;

    private async checkDuplicateEmail(email: string): Promise<void> {
        const existingUser = await this.user.findOne({ email });
        if (existingUser) {
            throw new Conflict('Email already registered!');
        }
    }
    private async checkDuplicatePhone(phone: string): Promise<void> {
        const existingUser = await this.user.findOne({ phone });
        if (existingUser) {
            throw new Conflict('Phone Number already registered!');
        }
    }

    private sanitizeUser(user: IUser): Partial<IUser> {
        return {
            _id: user._id,
            name: user.name,
            email: user.email,
            addresses: user.addresses,
            phone: user.phone,
            isEmailVerified: user.isEmailVerified,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
        };
    }

    private sanitizeOrder(order: IOrder): Partial<IOrder> {
        return {
            orderId: order.orderId,
            status: order.status,
            total_price: order.total_price,
            userId: order.userId,
            restaurantId: order.restaurantId,
            items: order.items,
            subtotal: order.subtotal,
            tax: order.tax,
            delivery_fee: order.delivery_fee,
            delivery_info: order.delivery_info,
            payment: order.payment,
            createdAt: order.createdAt,
            updatedAt: order.updatedAt,
        };
    }

    public async register(
        userData: RegisterUserto,
    ): Promise<RegistrationResponse> {
        await Promise.all([
            this.checkDuplicateEmail(userData.email),
            this.checkDuplicatePhone(userData.phone),
        ]);

        const user = await this.user.create({
            ...userData,
            isEmailVerified: false,
        });

        const verificationResult = await user.generateEmailVerificationOTP();
        const { otp, verificationToken } = verificationResult;
        await user.save();

        const emailOptions = sendOTPByEmail(user as IUser, otp);
        await EmailQueueService.addEmailToQueue(emailOptions);

        return {
            user: this.sanitizeUser(user),
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
            'emailVerificationOTP.expiresAt': { $gt: new Date() },
        });

        if (!user) {
            throw new BadRequest('Invalid or expired verification session');
        }

        if (!user?.emailVerificationOTP?.otp) {
            throw new BadRequest('No OTP found for this user');
        }

        if (new Date() > user.emailVerificationOTP.expiresAt) {
            throw new BadRequest('OTP has expired');
        }

        const isValid = await bcrypt.compare(
            otp,
            user.emailVerificationOTP.otp.toString(),
        );
        if (!isValid) {
            throw new BadRequest('Invalid OTP');
        }

        user.emailVerificationOTP = undefined;
        user.isEmailVerified = true;
        await user.save();

        const emailOptions = welcomeEmail(user as IUser);
        await EmailQueueService.addEmailToQueue(emailOptions);

        return user;
    }

    public async forgotPassword(email: string): Promise<string> {
        const user = await this.user.findOne({
            email: email.toLowerCase().trim(),
        });
        if (!user) {
            throw new ResourceNotFound('User not found');
        }

        const verificationResult = await user.generateEmailVerificationOTP();
        const { otp, verificationToken } = verificationResult;
        await user.save();

        const emailOptions = sendOTPByEmail(user as IUser, otp);
        await EmailQueueService.addEmailToQueue(emailOptions);

        return verificationToken;
    }

    public async verifyResetPasswordOTP(
        verificationToken: string,
        otp: string,
    ): Promise<IUser> {
        const user = await this.user.findOne({
            'emailVerificationOTP.verificationToken': verificationToken,
            'emailVerificationOTP.expiresAt': { $gt: new Date() },
        });

        if (!user) {
            throw new BadRequest('Invalid or expired reset token');
        }

        if (!user.emailVerificationOTP?.otp) {
            throw new BadRequest('No OTP found for this user');
        }

        if (new Date() > user.emailVerificationOTP.expiresAt) {
            throw new BadRequest('OTP has expired');
        }

        const isValid = await bcrypt.compare(
            otp,
            user.emailVerificationOTP.otp.toString(),
        );
        if (!isValid) {
            throw new BadRequest('Invalid OTP');
        }

        return user;
    }

    public async resetPassword(
        verificationToken: string,
        newPassword: string,
    ): Promise<void> {
        const user = await this.user.findOne({
            'emailVerificationOTP.verificationToken': verificationToken,
            'emailVerificationOTP.expiresAt': { $gt: new Date() },
        });

        if (!user) {
            throw new BadRequest('Invalid or expired reset token');
        }

        // Add the old password to history before updating
        user.passwordHistory = user.passwordHistory ?? [];

        const isPasswordUsedBefore = user.passwordHistory.some((entry) =>
            bcrypt.compareSync(newPassword, entry.password),
        );

        if (isPasswordUsedBefore) {
            throw new BadRequest(
                'This password has been used before. Please choose a new password.',
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
        await EmailQueueService.addEmailToQueue(emailOptions);
    }

    public async login(credentials: LoginCredentials): Promise<loginResponse> {
        const user = await this.user.findOne({ email: credentials.email });
        if (!user) {
            throw new ResourceNotFound('Invalid email or password');
        }

        if (!user.isEmailVerified) {
            throw new Forbidden('Verify your email before sign in.');
        }

        const isValid = await user.comparePassword(credentials.password);
        if (!isValid) {
            user.failedLoginAttempts += 1;
            if (user.failedLoginAttempts >= 3) {
                user.isLocked = true;
                await user.save();
                throw new Forbidden(
                    'Your account has been locked due to multiple failed login attempts. Please reset your password.',
                );
            }
            await user.save();
            throw new Unauthorized('Invalid email or password');
        }

        user.failedLoginAttempts = 0;
        await user.save();

        const requestedRole = credentials.role || 'user';
        if (!user.role.includes(requestedRole)) {
            throw new Forbidden(
                `You do not have permission to sign in as ${requestedRole}`,
            );
        }

        const token = TokenService.createAuthToken({
            userId: user._id.toString(),
            role: user.role,
        });

        return {
            user: this.sanitizeUser(user),
            token,
        };
    }

    public async getUserById(userId: string) {
        const user = await this.user.findById(userId).lean();

        if (!user) {
            throw new ResourceNotFound('User not found');
        }

        return {
            user: this.sanitizeUser(user),
        };
    }

    public async updateUserById(
        userId: string,
        data: Partial<IUser>,
    ): Promise<IUser | null> {
        const user = await this.user.findOneAndUpdate(
            { _id: userId },
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
            throw new ResourceNotFound('User not found');
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
                'Duplicate address: This address already exists.',
            );
        }

        const emailOptions = newAddressAdded(user as IUser, addressData);
        await EmailQueueService.addEmailToQueue(emailOptions);

        user.addresses.push(addressData);
        await user.save();
        return user;
    }

    public async getUserAddress(userId: string): Promise<Address[]> {
        const user = await this.user
            .findById(userId)
            .select('addresses')
            .lean();

        if (!user) {
            throw new ResourceNotFound('User not found');
        }

        return user.addresses || [];
    }

    public async deleteAddress(
        userId: string,
        addressId: string,
    ): Promise<void> {
        const user = await this.user.findById(userId);
        if (!user) {
            throw new ResourceNotFound('User not found');
        }

        const result = await this.user.findOneAndUpdate(
            { _id: userId, 'addresses._id': addressId },
            { $pull: { addresses: { _id: addressId } } },
            { new: true },
        );

        if (!result) {
            throw new ResourceNotFound('Address not found');
        }
    }

    public async getUserOrders(userId: string): Promise<Partial<IOrder>[]> {
        const user = await this.user.findById(userId);
        if (!user) {
            throw new ResourceNotFound('User not found');
        }

        // Find and return all orders for the user
        const orders = await this.order
            .find({ userId })
            .sort({ createdAt: -1 })
            .lean();

        return orders.map((order) => this.sanitizeOrder(order));
    }
}
