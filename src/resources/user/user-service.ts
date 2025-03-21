import bcrypt from 'bcryptjs';
import { config } from '../../config/index';
import { Request, Response } from 'express';
import UserModel from '../user/user-model';
import OrderModel from '../order/order-model';
import ReviewModel from '../review/review-model';
import { IOrder } from '../order/order-interface';
import { IReview } from '../review/review-interface';
import { orderData } from '../order/order-helper';
import { reviewData } from '../review/review-helper';
import { EmailQueueService } from '../../jobs';
import {
    LoginCredentials,
    IAddressPaginatedResponse,
    IOrderPaginatedResponse,
    IReviewPaginatedResponse,
} from '../../types/';
import {
    TokenService,
    withCachedData,
    CACHE_TTL,
    getPaginatedAndCachedResults,
    CACHE_KEYS,
    deleteCacheData,
} from '../../utils';
import {
    IUser,
    RegisterUserto,
    IAddress,
    RegistrationResponse,
    loginResponse,
} from '../user/user-interface';
import {
    sendOTPByEmail,
    welcomeEmail,
    PasswordResetEmail,
    newAddressAdded,
} from '../user/user-email-template';
import {
    Conflict,
    ResourceNotFound,
    BadRequest,
    Forbidden,
    Unauthorized,
} from '../../middlewares';
import {
    checkDuplicate,
    findUserByEmail,
    findUserById,
    findUserByVerificationToken,
    userData,
} from '../user/user-helper';

export class UserService {
    private user = UserModel;
    private order = OrderModel;
    private review = ReviewModel;
    private checkDuplicate = checkDuplicate;
    private findUserByEmail = findUserByEmail;
    private findUserById = findUserById;
    private orderData = orderData;
    private userData = userData;
    private reviewData = reviewData;
    private findUserByVerificationToken = findUserByVerificationToken;

    public async register(
        userData: RegisterUserto,
    ): Promise<RegistrationResponse> {
        await Promise.all([
            this.checkDuplicate('email', userData.email),
            this.checkDuplicate('phone', userData.phone),
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
            user: this.userData(user),
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
        const user = await this.findUserByEmail(email);
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
        const user = await this.findUserByVerificationToken(verificationToken);
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
        const user = await this.findUserByVerificationToken(verificationToken);
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

        const PASSWORD_HISTORY_LIMIT = Number(config.PASSWORD_HISTORY_LIMIT);
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
        const user = await this.findUserByEmail(credentials.email);
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
            user: this.userData(user),
            token,
        };
    }

    public async getUserById(userId: string): Promise<Partial<IUser>> {
        const user = await this.findUserById(userId);
        return this.userData(user);
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

        await Promise.all([
            deleteCacheData(CACHE_KEYS.USER_BY_ID(userId)),
            deleteCacheData(CACHE_KEYS.ALL_USERS),
        ]);

        return user;
    }

    public async changePassword(
        userId: string,
        currentPassword: string,
        newPassword: string,
    ): Promise<void> {
        const user = await this.findUserById(userId);

        const isPasswordValid = await bcrypt.compare(
            currentPassword,
            user.password,
        );
        if (!isPasswordValid) {
            throw new Unauthorized('Current password is incorrect');
        }

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

        const PASSWORD_HISTORY_LIMIT = Number(config.PASSWORD_HISTORY_LIMIT);
        if (user.passwordHistory.length > PASSWORD_HISTORY_LIMIT) {
            user.passwordHistory = user.passwordHistory.slice(
                -PASSWORD_HISTORY_LIMIT,
            );
        }

        user.password = newPassword;
        await user.save();
    }

    public async addNewAddress(
        userId: string,
        addressData: IAddress,
    ): Promise<IUser> {
        const user = await this.findUserById(userId);

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

    public async getUserAddress(
        req: Request,
        res: Response,
        userId: string,
    ): Promise<IAddressPaginatedResponse> {
        const paginatedResults = await getPaginatedAndCachedResults<IUser>(
            req,
            res,
            this.user,
            CACHE_KEYS.USER_ADDRESSES(userId),
            { _id: userId },
            { addresses: 1 },
        );

        const user = paginatedResults.results[0];
        if (!user) {
            throw new ResourceNotFound('User not found');
        }

        return {
            results: user.addresses || [],
            pagination: {
                currentPage: paginatedResults.currentPage,
                totalPages: paginatedResults.totalPages,
                limit: paginatedResults.limit,
            },
        };
    }

    public async getUserAddressById(
        userId: string,
        addressId: string,
    ): Promise<IAddress> {
        return withCachedData(
            CACHE_KEYS.USER_ADDRESS_BY_ID(userId, addressId),
            async () => {
                const user = await this.user
                    .findOne({
                        _id: userId,
                        'addresses._id': addressId,
                    })
                    .select('-__v')
                    .select('addresses.$');

                if (!user || !user.addresses[0]) {
                    throw new ResourceNotFound('Address not found');
                }

                return user.addresses[0];
            },
            CACHE_TTL.ONE_HOUR,
        );
    }

    public async deleteAddress(
        userId: string,
        addressId: string,
    ): Promise<void> {
        await this.findUserById(userId);

        const result = await this.user.findOneAndUpdate(
            { _id: userId, 'addresses._id': addressId },
            { $pull: { addresses: { _id: addressId } } },
            { new: true },
        );

        if (!result) {
            throw new ResourceNotFound('Address not found');
        }

        await Promise.all([
            deleteCacheData(CACHE_KEYS.USER_ADDRESSES(userId)),
            deleteCacheData(CACHE_KEYS.USER_ADDRESS_BY_ID(userId, addressId)),
        ]);
    }

    public async getUserOrders(
        req: Request,
        res: Response,
        userId: string,
    ): Promise<IOrderPaginatedResponse> {
        await this.findUserById(userId);

        const paginatedResults = await getPaginatedAndCachedResults<IOrder>(
            req,
            res,
            this.order,
            CACHE_KEYS.USER_ORDERS(userId),
            { userId },
        );

        return {
            results: paginatedResults.results.map((order: IOrder) =>
                this.orderData(order),
            ) as IOrder[],
            pagination: {
                currentPage: paginatedResults.currentPage,
                totalPages: paginatedResults.totalPages,
                limit: paginatedResults.limit,
            },
        };
    }

    public async getUserOrderById(
        userId: string,
        orderId: string,
    ): Promise<Partial<IOrder>> {
        return withCachedData(
            CACHE_KEYS.USER_ORDER_BY_ID(userId, orderId),
            async () => {
                const order = await this.order
                    .findOne({
                        _id: orderId,
                        userId: userId,
                    })
                    .lean();

                if (!order) {
                    throw new ResourceNotFound(
                        'Order not found or does not belong to this user',
                    );
                }

                return this.orderData(order);
            },
            CACHE_TTL.ONE_HOUR,
        );
    }

    public async getUserReviews(
        req: Request,
        res: Response,
        userId: string,
    ): Promise<IReviewPaginatedResponse> {
        const paginatedResults = await getPaginatedAndCachedResults<IReview>(
            req,
            res,
            this.review,
            CACHE_KEYS.USER_REVIEWS(userId),
            { userId },
        );

        return {
            results: paginatedResults.results.map((review) =>
                this.reviewData(review),
            ) as IReview[],
            pagination: {
                currentPage: paginatedResults.currentPage,
                totalPages: paginatedResults.totalPages,
                limit: paginatedResults.limit,
            },
        };
    }
}
