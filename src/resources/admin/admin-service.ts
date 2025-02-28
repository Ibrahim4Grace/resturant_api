import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { config } from '../../config/index';
import AdminModel from '../admin/admin-model';
import MenuModel from '../menu/menu-model';
import UserModel from '../user/user-model';
import RestaurantModel from '../restaurant/restaurant-model';
import RiderModel from '../rider/rider-model';
import OrderModel from '../order/order-model';
import ReviewModel from '../review/review-model';
import { IOrder } from '../order/order-interface';
import { IMenu } from '../menu/menu-interface';
import { menuData } from '../menu/menu-helper';
import { IUser } from '../user/user-interface';
import { IRider } from '../rider/rider-interface';
import { userData } from '../user/user-helper';
import { orderData } from '../order/order-helper';
import { riderData } from '../rider/rider-helper';
import { reviewData } from '../review/review-helper';
import { restaurantData } from '../restaurant/restaurant-helper';
import { IReview } from '../review/review-interface';
import {
    IRestaurant,
    RestaurantAnalytics,
} from '../restaurant/restaurant-interface';
import {
    sendOTPByEmail,
    welcomeEmail,
    PasswordResetEmail,
    userStatusUpdate,
    restaurantStatusUpdate,
} from '../admin/admin-email-template';
import {
    TokenService,
    EmailQueueService,
    CACHE_TTL,
    deleteCacheData,
    getPaginatedAndCachedResults,
    withCachedData,
    CACHE_KEYS,
} from '../../utils/index';
import {
    IAdmin,
    RegisterAdminto,
    loginResponse,
    RegistrationResponse,
} from '../admin/admin-interface';
import {
    ResourceNotFound,
    BadRequest,
    Forbidden,
    Unauthorized,
} from '../../middlewares/index';
import {
    LoginCredentials,
    IAdminPaginatedResponse,
    IUserPaginatedResponse,
    IRestaurantPaginatedResponse,
    IRiderPaginatedResponse,
    IOrderPaginatedResponse,
    IMenuPaginatedResponse,
    IReviewPaginatedResponse,
} from '../../types/index';
import {
    checkDuplicate,
    adminData,
    findAdminByEmail,
    findAdminById,
    findAdminByVerificationToken,
} from '../admin/admin-helper';

export class AdminService {
    private admin = AdminModel;
    private user = UserModel;
    private menu = MenuModel;
    private review = ReviewModel;
    private restaurant = RestaurantModel;
    private rider = RiderModel;
    private order = OrderModel;
    private checkDuplicate = checkDuplicate;
    private reviewData = reviewData;
    private userData = userData;
    private adminData = adminData;
    private riderData = riderData;
    private orderData = orderData;
    private menuData = menuData;
    private restaurantData = restaurantData;
    private findAdminByEmail = findAdminByEmail;
    private findAdminById = findAdminById;
    private findAdminByVerificationToken = findAdminByVerificationToken;

    public async register(
        adminData: RegisterAdminto,
    ): Promise<RegistrationResponse> {
        await Promise.all([
            this.checkDuplicate('email', adminData.email),
            this.checkDuplicate('phone', adminData.phone),
        ]);

        const admin = await this.admin.create({
            ...adminData,
            isEmailVerified: false,
        });

        const verificationResult = await admin.generateEmailVerificationOTP();
        const { otp, verificationToken } = verificationResult;
        await admin.save();

        const emailOptions = sendOTPByEmail(admin as IAdmin, otp);
        await EmailQueueService.addEmailToQueue(emailOptions);

        return {
            admin: this.adminData(admin),
            verificationToken: verificationToken,
        };
    }

    public async verifyRegistrationOTP(
        userId: string,
        otp: string,
    ): Promise<IAdmin> {
        const admin = await this.admin.findOne({
            _id: userId,
            isEmailVerified: false,
            'emailVerificationOTP.expiresAt': { $gt: new Date() },
        });

        if (!admin) {
            throw new BadRequest('Invalid or expired verification session');
        }

        if (!admin?.emailVerificationOTP?.otp) {
            throw new BadRequest('No OTP found for this admin');
        }

        if (new Date() > admin.emailVerificationOTP.expiresAt) {
            throw new BadRequest('OTP has expired');
        }

        const isValid = await bcrypt.compare(
            otp,
            admin.emailVerificationOTP.otp.toString(),
        );
        if (!isValid) {
            throw new BadRequest('Invalid OTP');
        }

        admin.emailVerificationOTP = undefined;
        admin.isEmailVerified = true;
        await admin.save();

        const emailOptions = welcomeEmail(admin as IAdmin);
        await EmailQueueService.addEmailToQueue(emailOptions);

        return admin;
    }

    public async forgotPassword(email: string): Promise<string> {
        const admin = await this.findAdminByEmail(email);
        if (!admin) {
            throw new ResourceNotFound('Admin not found');
        }

        const verificationResult = await admin.generateEmailVerificationOTP();
        const { otp, verificationToken } = verificationResult;
        await admin.save();

        const emailOptions = sendOTPByEmail(admin as IAdmin, otp);
        await EmailQueueService.addEmailToQueue(emailOptions);

        return verificationToken;
    }

    public async verifyResetPasswordOTP(
        verificationToken: string,
        otp: string,
    ): Promise<IAdmin> {
        const admin =
            await this.findAdminByVerificationToken(verificationToken);
        if (!admin) {
            throw new BadRequest('Invalid or expired reset token');
        }

        if (!admin.emailVerificationOTP?.otp) {
            throw new BadRequest('No OTP found for this admin');
        }

        if (new Date() > admin.emailVerificationOTP.expiresAt) {
            throw new BadRequest('OTP has expired');
        }

        const isValid = await bcrypt.compare(
            otp,
            admin.emailVerificationOTP.otp.toString(),
        );
        if (!isValid) {
            throw new BadRequest('Invalid OTP');
        }

        return admin;
    }

    public async resetPassword(
        verificationToken: string,
        newPassword: string,
    ): Promise<void> {
        const admin =
            await this.findAdminByVerificationToken(verificationToken);
        if (!admin) {
            throw new BadRequest('Invalid or expired reset token');
        }

        admin.passwordHistory = admin.passwordHistory ?? [];
        const isPasswordUsedBefore = admin.passwordHistory.some((entry) =>
            bcrypt.compareSync(newPassword, entry.password),
        );

        if (isPasswordUsedBefore) {
            throw new BadRequest(
                'This password has been used before. Please choose a new password.',
            );
        }

        admin.passwordHistory.push({
            password: admin.password,
            changedAt: new Date(),
        });

        const PASSWORD_HISTORY_LIMIT = Number(config.PASSWORD_HISTORY_LIMIT);
        if (admin.passwordHistory.length > PASSWORD_HISTORY_LIMIT) {
            admin.passwordHistory = admin.passwordHistory.slice(
                -PASSWORD_HISTORY_LIMIT,
            );
        }

        admin.password = newPassword;
        admin.emailVerificationOTP = undefined;
        admin.failedLoginAttempts = 0;
        admin.isLocked = false;
        await admin.save();

        const emailOptions = PasswordResetEmail(admin as IAdmin);
        await EmailQueueService.addEmailToQueue(emailOptions);
    }

    public async login(credentials: LoginCredentials): Promise<loginResponse> {
        const admin = await this.findAdminByEmail(credentials.email);
        if (!admin) {
            throw new ResourceNotFound('Invalid email or password');
        }

        if (!admin.isEmailVerified) {
            throw new Forbidden('Verify your email before sign in.');
        }

        const isValid = await admin.comparePassword(credentials.password);
        if (!isValid) {
            admin.failedLoginAttempts += 1;
            if (admin.failedLoginAttempts >= 3) {
                admin.isLocked = true;
                await admin.save();
                throw new Forbidden(
                    'Your account has been locked due to multiple failed login attempts. Please reset your password.',
                );
            }
            await admin.save();
            throw new Unauthorized('Invalid email or password');
        }

        admin.failedLoginAttempts = 0;
        await admin.save();

        const requestedRole = credentials.role || 'admin';
        if (!admin.role.includes(requestedRole)) {
            throw new Forbidden(
                `You do not have permission to sign in as ${requestedRole}`,
            );
        }

        const token = TokenService.createAuthToken({
            userId: admin._id,
            role: admin.role,
        });

        return {
            admin: this.adminData(admin),
            token,
        };
    }

    public async getAdminById(adminId: string): Promise<Partial<IAdmin>> {
        const admin = await this.findAdminById(adminId);
        return this.adminData(admin);
    }

    public async updateAdminById(
        adminId: string,
        data: Partial<IAdmin>,
    ): Promise<Partial<IAdmin>> {
        await Promise.all([
            this.checkDuplicate('email', data.email),
            this.checkDuplicate('phone', data.phone),
        ]);
        const admin = await this.admin.findOneAndUpdate(
            { _id: adminId },
            { $set: data },
            { new: true },
        );

        await Promise.all([
            deleteCacheData(CACHE_KEYS.ADMIN_BY_ID(adminId)),
            deleteCacheData(CACHE_KEYS.ALL_ADMINS),
        ]);

        return this.adminData(admin);
    }

    public async changeAdminPassword(
        adminId: string,
        currentPassword: string,
        newPassword: string,
    ): Promise<void> {
        const admin = await this.findAdminById(adminId);

        const isPasswordValid = await bcrypt.compare(
            currentPassword,
            admin.password,
        );
        if (!isPasswordValid) {
            throw new Unauthorized('Current password is incorrect');
        }

        admin.passwordHistory = admin.passwordHistory ?? [];
        const isPasswordUsedBefore = admin.passwordHistory.some((entry) =>
            bcrypt.compareSync(newPassword, entry.password),
        );
        if (isPasswordUsedBefore) {
            throw new BadRequest(
                'This password has been used before. Please choose a new password.',
            );
        }
        admin.passwordHistory.push({
            password: admin.password,
            changedAt: new Date(),
        });

        const PASSWORD_HISTORY_LIMIT = Number(config.PASSWORD_HISTORY_LIMIT);
        if (admin.passwordHistory.length > PASSWORD_HISTORY_LIMIT) {
            admin.passwordHistory = admin.passwordHistory.slice(
                -PASSWORD_HISTORY_LIMIT,
            );
        }

        admin.password = newPassword;
        await admin.save();
    }

    public async fetchAllAdmins(
        req: Request,
        res: Response,
    ): Promise<IAdminPaginatedResponse> {
        const paginatedResults = await getPaginatedAndCachedResults<IAdmin>(
            req,
            res,
            this.admin,
            CACHE_KEYS.ALL_ADMINS,
            {},
        );

        return {
            results: paginatedResults.results.map(
                (admin) => adminData(admin) as IAdmin,
            ),
            pagination: {
                currentPage: paginatedResults.currentPage,
                totalPages: paginatedResults.totalPages,
                limit: paginatedResults.limit,
            },
        };
    }

    public async fetchAdminsById(id: string): Promise<Partial<IAdmin>> {
        return withCachedData(
            CACHE_KEYS.ADMIN_BY_ID(id),
            async () => {
                const admin = await this.admin.findById(id);
                if (!admin) throw new ResourceNotFound('Admin not found');
                return adminData(admin);
            },
            CACHE_TTL.ONE_HOUR,
        );
    }

    public async deletedAdmin(id: string): Promise<IAdmin> {
        const admin = await this.admin.findByIdAndDelete(id);
        if (!admin) {
            throw new ResourceNotFound('Admin not found');
        }

        await Promise.all([
            deleteCacheData(CACHE_KEYS.ADMIN_BY_ID(id)),
            deleteCacheData(CACHE_KEYS.ALL_ADMINS),
        ]);

        return admin;
    }

    public async allUsers(
        req: Request,
        res: Response,
    ): Promise<IUserPaginatedResponse> {
        const paginatedResults = await getPaginatedAndCachedResults<IUser>(
            req,
            res,
            this.user,
            CACHE_KEYS.ALL_USERS,
            {},
        );

        return {
            results: paginatedResults.results.map(
                (user) => userData(user) as IUser,
            ),
            pagination: {
                currentPage: paginatedResults.currentPage,
                totalPages: paginatedResults.totalPages,
                limit: paginatedResults.limit,
            },
        };
    }

    public async fetchUserById(userId: string): Promise<Partial<IUser>> {
        return withCachedData(
            CACHE_KEYS.USER_BY_ID(userId),
            async () => {
                const user = await this.user.findById(userId);
                if (!user) throw new ResourceNotFound('User not found');
                return userData(user);
            },
            CACHE_TTL.ONE_HOUR,
        );
    }

    public async deleteUser(userId: string): Promise<IUser> {
        const user = await this.user.findByIdAndDelete(userId);
        if (!user) {
            throw new ResourceNotFound('User not found');
        }

        await Promise.all([
            deleteCacheData(CACHE_KEYS.USER_BY_ID(userId)),
            deleteCacheData(CACHE_KEYS.ALL_USERS),
        ]);
        return user;
    }

    public async updateUserStatus(
        userId: string,
        isLocked: boolean,
    ): Promise<Partial<IUser>> {
        const updatedUser = await this.user.findByIdAndUpdate(
            userId,
            { isLocked },
            { new: true },
        );

        if (!updatedUser) {
            throw new ResourceNotFound('User not found');
        }
        const emailOptions = userStatusUpdate(updatedUser);
        await EmailQueueService.addEmailToQueue(emailOptions);

        await Promise.all([
            deleteCacheData(CACHE_KEYS.USER_BY_ID(userId)),
            deleteCacheData(CACHE_KEYS.ALL_USERS),
        ]);

        return this.userData(updatedUser);
    }

    public async fetchAllRestaurants(
        req: Request,
        res: Response,
    ): Promise<IRestaurantPaginatedResponse> {
        const paginatedResults =
            await getPaginatedAndCachedResults<IRestaurant>(
                req,
                res,
                this.restaurant,
                CACHE_KEYS.ALL_RESTAURANTS,
                {},
            );

        return {
            results: paginatedResults.results.map(
                (restaurant) => restaurantData(restaurant) as IRestaurant,
            ),
            pagination: {
                currentPage: paginatedResults.currentPage,
                totalPages: paginatedResults.totalPages,
                limit: paginatedResults.limit,
            },
        };
    }

    public async fetchRestaurantById(
        restaurantId: string,
    ): Promise<Partial<IRestaurant>> {
        return withCachedData(
            CACHE_KEYS.RESTAURANT_BY_ID(restaurantId),
            async () => {
                const restaurant = await this.restaurant.findById(restaurantId);
                if (!restaurant)
                    throw new ResourceNotFound('Restaurant not found');

                return restaurantData(restaurant);
            },
            CACHE_TTL.ONE_HOUR,
        );
    }

    public async restaurantStatus(
        restaurantId: string,
        status: string,
    ): Promise<Partial<IRestaurant>> {
        const allowedStatuses = ['active', 'suspended', 'pending'];
        if (!allowedStatuses.includes(status)) {
            throw new BadRequest(
                `Status must be one of: ${allowedStatuses.join(', ')}`,
            );
        }

        const updatedRestaurant = await this.restaurant.findByIdAndUpdate(
            restaurantId,
            { status },
            { new: true },
        );

        if (!updatedRestaurant) {
            throw new ResourceNotFound('User not found');
        }

        const emailOptions = restaurantStatusUpdate(updatedRestaurant);
        await EmailQueueService.addEmailToQueue(emailOptions);

        await Promise.all([
            deleteCacheData(CACHE_KEYS.RESTAURANT_BY_ID(restaurantId)),
            deleteCacheData(CACHE_KEYS.ALL_RESTAURANTS),
        ]);

        return this.restaurantData(updatedRestaurant);
    }

    public async deleteRestaurant(restaurantId: string): Promise<IRestaurant> {
        const restaurant =
            await this.restaurant.findByIdAndDelete(restaurantId);
        if (!restaurant) {
            throw new ResourceNotFound('Restaurant not found');
        }

        await Promise.all([
            deleteCacheData(CACHE_KEYS.RESTAURANT_BY_ID(restaurantId)),
            deleteCacheData(CACHE_KEYS.ALL_RESTAURANTS),
        ]);
        return restaurant;
    }

    public async getRestaurantAnalytics(): Promise<RestaurantAnalytics> {
        const cacheKey = CACHE_KEYS.ADMIN_RESTAURANT_ANALYTICS;

        return withCachedData<RestaurantAnalytics>(
            cacheKey,
            async () => {
                const totalOrders = await this.order.countDocuments({});
                const revenue = await this.order.aggregate([
                    {
                        $group: {
                            _id: null,
                            total: { $sum: '$totalAmount' },
                            average: { $avg: '$totalAmount' },
                        },
                    },
                ]);

                const restaurants = await this.restaurant.find({});
                const totalReviews = restaurants.reduce(
                    (sum, restaurant) =>
                        sum + restaurant.reviewStats.totalReviews,
                    0,
                );
                const averageRating =
                    restaurants.reduce(
                        (sum, restaurant) =>
                            sum + restaurant.reviewStats.averageRating,
                        0,
                    ) / restaurants.length;

                return {
                    totalOrders,
                    revenue: {
                        total: revenue[0]?.total || 0,
                        average: revenue[0]?.average || 0,
                    },
                    ratings: {
                        average: averageRating,
                        total: totalReviews,
                    },
                };
            },
            CACHE_TTL.FIFTEEN_MINUTES,
        );
    }

    public async fetchAllRiders(
        req: Request,
        res: Response,
    ): Promise<IRiderPaginatedResponse> {
        const paginatedResults = await getPaginatedAndCachedResults<IRider>(
            req,
            res,
            this.rider,
            CACHE_KEYS.ALL_RIDERS,
            {},
        );

        return {
            results: paginatedResults.results.map(
                (rider) => riderData(rider) as IRider,
            ),
            pagination: {
                currentPage: paginatedResults.currentPage,
                totalPages: paginatedResults.totalPages,
                limit: paginatedResults.limit,
            },
        };
    }

    public async fetchRiderById(riderId: string): Promise<Partial<IRider>> {
        return withCachedData(
            CACHE_KEYS.RIDER_BY_ID(riderId),
            async () => {
                const rider = await this.rider.findById(riderId);
                if (!rider) throw new ResourceNotFound('Rider not found');
                return riderData(rider);
            },
            CACHE_TTL.ONE_HOUR,
        );
    }

    public async deleteRider(riderId: string): Promise<IRider> {
        const rider = await this.rider.findByIdAndDelete(riderId);
        if (!rider) {
            throw new ResourceNotFound('Rider not found');
        }

        await Promise.all([
            deleteCacheData(CACHE_KEYS.RIDER_BY_ID(riderId)),
            deleteCacheData(CACHE_KEYS.ALL_RIDERS),
        ]);
        return rider;
    }

    public async fetchAllOrders(
        req: Request,
        res: Response,
    ): Promise<IOrderPaginatedResponse> {
        const paginatedResults = await getPaginatedAndCachedResults<IOrder>(
            req,
            res,
            this.order,
            CACHE_KEYS.ALL_ORDERS,
            {},
        );

        return {
            results: paginatedResults.results.map(
                (order) => orderData(order) as IOrder,
            ),
            pagination: {
                currentPage: paginatedResults.currentPage,
                totalPages: paginatedResults.totalPages,
                limit: paginatedResults.limit,
            },
        };
    }

    public async fetchOrdersById(orderId: string): Promise<Partial<IOrder>> {
        return withCachedData(
            CACHE_KEYS.ORDER_BY_ID(orderId),
            async () => {
                const order = await this.order.findById(orderId);
                if (!order) throw new ResourceNotFound('Order not found');
                return orderData(order);
            },
            CACHE_TTL.ONE_HOUR,
        );
    }

    public async deleteOrder(orderId: string): Promise<IOrder> {
        const order = await this.order.findByIdAndDelete(orderId);
        if (!order) {
            throw new ResourceNotFound('Order not found');
        }

        await Promise.all([
            deleteCacheData(CACHE_KEYS.ORDER_BY_ID(orderId)),
            deleteCacheData(CACHE_KEYS.ALL_ORDERS),
        ]);
        return order;
    }

    public async fetchAllMenus(
        req: Request,
        res: Response,
    ): Promise<IMenuPaginatedResponse> {
        const paginatedResults = await getPaginatedAndCachedResults<IMenu>(
            req,
            res,
            this.menu,
            CACHE_KEYS.ADMIN_ALL_MENUS,
            {},
        );

        return {
            results: paginatedResults.results.map(
                (menu) => menuData(menu) as unknown as IMenu,
            ),
            pagination: {
                currentPage: paginatedResults.currentPage,
                totalPages: paginatedResults.totalPages,
                limit: paginatedResults.limit,
            },
        };
    }

    public async fetchMenuById(menuId: string): Promise<Partial<IMenu>> {
        return withCachedData(
            CACHE_KEYS.ADMIN_MENU_BY_ID(menuId),
            async () => {
                const menu = await this.menu.findById(menuId);
                if (!menu) throw new ResourceNotFound('Menu not found');
                return menuData(menu) as unknown as Partial<IMenu>;
            },
            CACHE_TTL.ONE_HOUR,
        );
    }

    public async deleteMenu(menuId: string): Promise<IMenu> {
        const menu = await this.menu.findByIdAndDelete(menuId);
        if (!menu) {
            throw new ResourceNotFound('Menu not found');
        }

        const restaurantId = menu.restaurantId.toString();
        await this.menu.findByIdAndDelete(menuId);

        await Promise.all([
            deleteCacheData(CACHE_KEYS.ADMIN_MENU_BY_ID(menuId)),
            deleteCacheData(CACHE_KEYS.ADMIN_ALL_MENUS),
            deleteCacheData(CACHE_KEYS.MENU_BY_ID(menuId, restaurantId)),
            deleteCacheData(CACHE_KEYS.ALL_MENUS(restaurantId)),
        ]);
        return menu;
    }

    public async fetchRestaurantMenus(
        req: Request,
        res: Response,
        restaurantId: string,
    ): Promise<IMenuPaginatedResponse> {
        const restaurant = await this.restaurant.findById(restaurantId);
        if (!restaurant) {
            throw new ResourceNotFound('Restaurant not found');
        }

        const paginatedResults = await getPaginatedAndCachedResults<IMenu>(
            req,
            res,
            this.menu,
            CACHE_KEYS.RESTAURANT_MENUS(restaurantId),
            { restaurantId: restaurantId },
        );

        return {
            results: paginatedResults.results.map(
                (menu) => menuData(menu) as unknown as IMenu,
            ),
            pagination: {
                currentPage: paginatedResults.currentPage,
                totalPages: paginatedResults.totalPages,
                limit: paginatedResults.limit,
            },
        };
    }

    public async getReviews(
        req: Request,
        res: Response,
    ): Promise<IReviewPaginatedResponse> {
        const paginatedResults = await getPaginatedAndCachedResults<IReview>(
            req,
            res,
            this.review,
            CACHE_KEYS.ALL_REVIEWS,
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

    public async fetchReviewById(reviewId: string): Promise<Partial<IReview>> {
        return withCachedData(
            CACHE_KEYS.TARGET_REVIEWS('review', reviewId),
            async () => {
                const review = await this.review.findById(reviewId);
                if (!review) throw new ResourceNotFound('Review not found');
                return reviewData(review);
            },
            CACHE_TTL.ONE_HOUR,
        );
    }

    public async deleteReview(reviewId: string): Promise<IReview> {
        const review = await this.review.findByIdAndDelete(reviewId);
        if (!review) {
            throw new ResourceNotFound('Menu not found');
        }

        await Promise.all([
            deleteCacheData(CACHE_KEYS.TARGET_REVIEWS('review', reviewId)),
            deleteCacheData(CACHE_KEYS.ALL_REVIEWS),
        ]);
        return review;
    }
}
