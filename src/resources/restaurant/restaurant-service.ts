import bcrypt from 'bcryptjs';
import { Request, Response } from 'express';
import { Types } from 'mongoose';
import RestaurantModel from '../restaurant/restaurant-model';
import UserModel from '../user/user-model';
import { CloudinaryService } from '../../config/index';
import OrderModel from '../order/order-model';
import { orderData } from '../order/order-helper';
import { IOrder } from '../order/order-interface';

import {
    LoginCredentials,
    UploadedImage,
    IOrderPaginatedResponse,
} from '../../types/index';
import {
    IRestaurant,
    RegisterRestaurantto,
    Address,
    RegistrationResponse,
    RestaurantCreationResponse,
    ISanitizedRestaurant,
    RestaurantAnalytics,
} from '../restaurant/restaurant-interface';
import {
    sendOTPByEmail,
    pendingVerificationEmail,
    PasswordResetEmail,
} from '../restaurant/restaurant-email-template';
import {
    TokenService,
    EmailQueueService,
    withCachedData,
    CACHE_TTL,
    getPaginatedAndCachedResults,
    CACHE_KEYS,
} from '../../utils/index';
import {
    Conflict,
    ResourceNotFound,
    BadRequest,
    Forbidden,
    Unauthorized,
} from '../../middlewares/index';
import {
    checkDuplicate,
    checkDuplicateAddress,
    findRestaurantByVerificationToken,
    restaurantData,
} from '../restaurant/restaurant-helper';

export class RestaurantService {
    private restaurant = RestaurantModel;
    private user = UserModel;
    private order = OrderModel;
    private orderData = orderData;
    private checkDuplicate = checkDuplicate;
    private checkDuplicateAddress = checkDuplicateAddress;
    private findRestaurantByVerificationToken =
        findRestaurantByVerificationToken;
    private restaurantData = restaurantData;
    private cloudinaryService: CloudinaryService;

    constructor() {
        this.cloudinaryService = new CloudinaryService();
    }

    public async register(
        restaurantData: RegisterRestaurantto,
        file?: Express.Multer.File,
    ): Promise<RegistrationResponse> {
        await Promise.all([
            this.checkDuplicate('email', restaurantData.email),
            this.checkDuplicate('phone', restaurantData.phone),
            this.checkDuplicateAddress(restaurantData.address),
        ]);

        const user = await this.user.create({
            name: restaurantData.name,
            email: restaurantData.email,
            password: restaurantData.password,
            phone: restaurantData.phone,
            isEmailVerified: true,
        });

        let businessLicense: UploadedImage | undefined;
        if (file) {
            const uploadResult = await this.cloudinaryService.uploadImage(file);
            businessLicense = {
                imageId: uploadResult.imageId,
                imageUrl: uploadResult.imageUrl,
            };
        }

        const restaurant = await this.restaurant.create({
            ...restaurantData,
            businessLicense,
            ownerId: user._id,
            status: 'pending',
            isEmailVerified: false,
        });

        const verificationResult =
            await restaurant.generateEmailVerificationOTP();
        const { otp, verificationToken } = verificationResult;
        await restaurant.save();

        const emailOptions = sendOTPByEmail(restaurant as IRestaurant, otp);
        await EmailQueueService.addEmailToQueue(emailOptions);

        return {
            restaurant: this.restaurantData(restaurant),
            verificationToken,
        };
    }

    public async verifyRegistrationOTP(
        userId: string,
        otp: string,
    ): Promise<IRestaurant> {
        const restaurant = await this.restaurant.findOne({
            _id: userId,
            isEmailVerified: false,
            'emailVerificationOTP.expiresAt': { $gt: new Date() },
        });

        if (!restaurant) {
            throw new BadRequest('Invalid or expired verification session');
        }

        if (!restaurant?.emailVerificationOTP?.otp) {
            throw new BadRequest('No OTP found for this restaurant');
        }

        if (new Date() > restaurant.emailVerificationOTP.expiresAt) {
            throw new BadRequest('OTP has expired');
        }

        const isValid = await bcrypt.compare(
            otp,
            restaurant.emailVerificationOTP.otp.toString(),
        );
        if (!isValid) {
            throw new BadRequest('Invalid OTP');
        }

        restaurant.emailVerificationOTP = undefined;
        restaurant.isEmailVerified = true;
        await restaurant.save();

        const emailOptions = pendingVerificationEmail(
            restaurant as IRestaurant,
        );
        await EmailQueueService.addEmailToQueue(emailOptions);

        return restaurant;
    }

    public async forgotPassword(email: string): Promise<string> {
        const restaurant = await this.restaurant.findOne({
            email: email.toLowerCase().trim(),
        });
        if (!restaurant) {
            throw new ResourceNotFound('Restaurant not found');
        }

        const verificationResult =
            await restaurant.generateEmailVerificationOTP();
        const { otp, verificationToken } = verificationResult;
        await restaurant.save();

        const emailOptions = sendOTPByEmail(restaurant as IRestaurant, otp);
        await EmailQueueService.addEmailToQueue(emailOptions);

        return verificationToken;
    }

    public async verifyResetPasswordOTP(
        verificationToken: string,
        otp: string,
    ): Promise<IRestaurant> {
        const restaurant =
            await this.findRestaurantByVerificationToken(verificationToken);
        if (!restaurant) {
            throw new BadRequest('Invalid or expired reset token');
        }

        if (!restaurant.emailVerificationOTP?.otp) {
            throw new BadRequest('No OTP found for this restaurant');
        }

        if (new Date() > restaurant.emailVerificationOTP.expiresAt) {
            throw new BadRequest('OTP has expired');
        }

        const isValid = await bcrypt.compare(
            otp,
            restaurant.emailVerificationOTP.otp.toString(),
        );
        if (!isValid) {
            throw new BadRequest('Invalid OTP');
        }

        return restaurant;
    }

    public async resetPassword(
        verificationToken: string,
        newPassword: string,
    ): Promise<void> {
        const restaurant =
            await this.findRestaurantByVerificationToken(verificationToken);
        if (!restaurant) {
            throw new BadRequest('Invalid or expired reset token');
        }

        restaurant.passwordHistory = restaurant.passwordHistory ?? [];
        restaurant.passwordHistory.push({
            password: restaurant.password,
            changedAt: new Date(),
        });

        restaurant.password = newPassword;
        restaurant.emailVerificationOTP = undefined;
        await restaurant.save();

        const emailOptions = PasswordResetEmail(restaurant as IRestaurant);
        await EmailQueueService.addEmailToQueue(emailOptions);
    }

    public async login(
        credentials: LoginCredentials,
    ): Promise<{ restaurant: ISanitizedRestaurant; token: string }> {
        const restaurant = await this.restaurant.findOne({
            email: credentials.email,
        });
        if (!restaurant) {
            throw new ResourceNotFound('Invalid email or password');
        }

        if (!restaurant.isEmailVerified) {
            throw new Forbidden('Verify your email before sign in.');
        }

        if (restaurant.status !== 'active') {
            throw new Forbidden(
                'Your account is not active. Please contact support or wait for approval.',
            );
        }

        const isValid = await restaurant.comparePassword(credentials.password);
        if (!isValid) {
            restaurant.failedLoginAttempts += 1;
            if (restaurant.failedLoginAttempts >= 3) {
                restaurant.isLocked = true;
                await restaurant.save();
                throw new Forbidden(
                    'Your account has been locked due to multiple failed login attempts. Please reset your password.',
                );
            }
            await restaurant.save();
            throw new Unauthorized('Invalid email or password');
        }

        restaurant.failedLoginAttempts = 0;
        await restaurant.save();

        const requestedRole = 'restaurant_owner';
        if (!restaurant.role.includes(requestedRole)) {
            throw new Forbidden(
                `You do not have permission to sign in as ${requestedRole}`,
            );
        }

        const token = TokenService.createAuthToken({
            userId: restaurant._id,
            role: requestedRole,
        });

        return {
            restaurant: this.restaurantData(restaurant),
            token,
        };
    }

    public async createRestaurant(
        restaurantData: RegisterRestaurantto,
        file?: Express.Multer.File,
    ): Promise<RestaurantCreationResponse> {
        await Promise.all([
            this.checkDuplicate('email', restaurantData.email),
            this.checkDuplicateAddress(restaurantData.address),
        ]);

        let businessLicense: UploadedImage | undefined;
        if (file) {
            const uploadResult = await this.cloudinaryService.uploadImage(file);
            businessLicense = {
                imageId: uploadResult.imageId,
                imageUrl: uploadResult.imageUrl,
            };
        }

        const restaurant = await this.restaurant.create({
            ...restaurantData,
            businessLicense,
            status: 'pending',
            isEmailVerified: true,
        });

        const emailOptions = pendingVerificationEmail(
            restaurant as IRestaurant,
        );
        await EmailQueueService.addEmailToQueue(emailOptions);

        const restaurantToken = TokenService.createAuthToken({
            userId: restaurant._id,
            role: restaurant.role,
        });

        return {
            restaurant: this.restaurantData(restaurant),
            token: restaurantToken,
        };
    }

    public async getRestaurant(
        restaurantId: string,
    ): Promise<ISanitizedRestaurant> {
        const cacheKey = CACHE_KEYS.RESTAURANT_BY_ID(restaurantId);

        return withCachedData<ISanitizedRestaurant>(
            cacheKey,
            async () => {
                const restaurant = await this.restaurant
                    .findById(restaurantId)
                    .lean();

                if (!restaurant) {
                    throw new ResourceNotFound('Restaurant not found');
                }

                return this.restaurantData(restaurant);
            },
            CACHE_TTL.ONE_HOUR,
        );
    }

    public async updateRestaurant(
        restaurantId: string,
        data: Partial<IRestaurant>,
    ): Promise<Partial<IRestaurant> | null> {
        const restaurant = await this.restaurant.findOneAndUpdate(
            { _id: restaurantId },
            { $set: data },
            { new: true },
        );

        if (!restaurant) {
            return null;
        }

        return this.restaurantData(restaurant);
    }

    public async getRestaurantAnalytics(
        restaurantId: string,
    ): Promise<RestaurantAnalytics> {
        const cacheKey = CACHE_KEYS.RESTAURANT_ANALYTICS(restaurantId);

        return withCachedData<RestaurantAnalytics>(
            cacheKey,
            async () => {
                const restaurant = await this.restaurant.findById(restaurantId);
                if (!restaurant) {
                    throw new ResourceNotFound('Restaurant not found');
                }

                const orders = await this.order.countDocuments({
                    restaurantId,
                });
                const revenue = await this.order.aggregate([
                    {
                        $match: {
                            restaurantId: new Types.ObjectId(restaurantId),
                        },
                    },
                    {
                        $group: {
                            _id: null,
                            total: { $sum: '$totalAmount' },
                            average: { $avg: '$totalAmount' },
                        },
                    },
                ]);

                return {
                    totalOrders: orders,
                    revenue: {
                        total: revenue[0]?.total || 0,
                        average: revenue[0]?.average || 0,
                    },
                    ratings: {
                        average: restaurant.reviewStats.averageRating,
                        total: restaurant.reviewStats.totalReviews,
                    },
                };
            },
            CACHE_TTL.FIFTEEN_MINUTES,
        );
    }

    public async getRestaurantOrders(
        req: Request,
        res: Response,
        restaurantId: string,
    ): Promise<IOrderPaginatedResponse> {
        const paginatedResults = await getPaginatedAndCachedResults<IOrder>(
            req,
            res,
            this.order,
            CACHE_KEYS.ALL_RESTAURANT_ORDERS(restaurantId),
            { restaurantId },
        );

        return {
            results: paginatedResults.results.map((order) =>
                this.orderData(order),
            ) as IOrder[],
            pagination: {
                currentPage: paginatedResults.currentPage,
                totalPages: paginatedResults.totalPages,
                limit: paginatedResults.limit,
            },
        };
    }
}
