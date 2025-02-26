import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import AdminModel from '../admin/admin-model';
import UserModel from '../user/user-model';
import RestaurantModel from '../restaurant/model';
import RiderModel from '../rider/rider-model';
import OrderModel from '../order/order-model';
import { IOrder } from '../order/order-interface';
import { IUser } from '../user/user-interface';
import { IRestaurant } from '../restaurant/interface';
import { IRider } from '../rider/rider-interface';
import {
    sendOTPByEmail,
    welcomeEmail,
    PasswordResetEmail,
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
    Conflict,
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
} from '../../types/index';

export class AdminService {
    private admin = AdminModel;
    private user = UserModel;
    private restaurant = RestaurantModel;
    private rider = RiderModel;
    private order = OrderModel;

    private async checkDuplicate(
        field: 'email' | 'phone',
        value: string,
    ): Promise<void> {
        const existingUser = await this.admin.findOne({ [field]: value });
        if (existingUser) {
            throw new Conflict(
                `${field === 'email' ? 'Email' : 'Phone Number'} already registered!`,
            );
        }
    }

    private adminData(admin: IAdmin): Partial<IAdmin> {
        return {
            _id: admin._id,
            name: admin.name,
            email: admin.email,
            phone: admin.phone,
            address: admin.address,
            role: admin.role,
            createdAt: admin.createdAt,
            updatedAt: admin.updatedAt,
        };
    }

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
        const admin = await this.admin.findOne({
            email: email.toLowerCase().trim(),
        });
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
        const admin = await this.admin.findOne({
            'emailVerificationOTP.verificationToken': verificationToken,
            'emailVerificationOTP.expiresAt': { $gt: new Date() },
        });

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
        const admin = await this.admin.findOne({
            'emailVerificationOTP.verificationToken': verificationToken,
            'emailVerificationOTP.expiresAt': { $gt: new Date() },
        });

        if (!admin) {
            throw new BadRequest('Invalid or expired reset token');
        }

        // Add the old password to history before updating
        admin.passwordHistory = admin.passwordHistory ?? [];
        admin.passwordHistory.push({
            password: admin.password,
            changedAt: new Date(),
        });

        admin.password = newPassword;
        admin.emailVerificationOTP = undefined;
        await admin.save();

        const emailOptions = PasswordResetEmail(admin as IAdmin);
        await EmailQueueService.addEmailToQueue(emailOptions);
    }

    public async login(credentials: LoginCredentials): Promise<loginResponse> {
        const admin = await this.admin.findOne({
            email: credentials.email,
        });
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

    public async fetchAllAdmins(
        req: Request,
        res: Response,
    ): Promise<IAdminPaginatedResponse> {
        const paginatedResults = await getPaginatedAndCachedResults<IAdmin>(
            req,
            res,
            this.admin,
            CACHE_KEYS.ALL_ADMINS,
            { name: 1, email: 1, address: 1, phone: 1, role: 1 },
        );

        return {
            results: paginatedResults.results,
            pagination: {
                currentPage: paginatedResults.currentPage,
                totalPages: paginatedResults.totalPages,
                limit: paginatedResults.limit,
            },
        };
    }

    public async fetchAdminsById(userId: string): Promise<IAdmin> {
        return withCachedData(
            CACHE_KEYS.ADMIN_BY_ID(userId),
            async () => {
                const admin = await this.admin.findById(userId);
                if (!admin) throw new ResourceNotFound('Admin not found');
                return admin;
            },
            CACHE_TTL.ONE_HOUR,
        );
    }

    public async deletedAdmin(userId: string): Promise<IAdmin> {
        const admin = await this.admin.findByIdAndDelete(userId);
        if (!admin) {
            throw new ResourceNotFound('Admin not found');
        }

        await Promise.all([
            deleteCacheData(CACHE_KEYS.ADMIN_BY_ID(userId)),
            deleteCacheData(CACHE_KEYS.ALL_ADMINS),
        ]);

        return admin;
    }

    public async fetchAllUsers(
        req: Request,
        res: Response,
    ): Promise<IUserPaginatedResponse> {
        const paginatedResults = await getPaginatedAndCachedResults<IUser>(
            req,
            res,
            this.user,
            CACHE_KEYS.ALL_USERS,
            { name: 1, email: 1, addresses: 1, phone: 1, status: 1 },
        );

        return {
            results: paginatedResults.results,
            pagination: {
                currentPage: paginatedResults.currentPage,
                totalPages: paginatedResults.totalPages,
                limit: paginatedResults.limit,
            },
        };
    }

    public async fetchUserById(userId: string): Promise<IUser> {
        return withCachedData(
            CACHE_KEYS.USER_BY_ID(userId),
            async () => {
                const user = await this.user.findById(userId);
                if (!user) throw new ResourceNotFound('User not found');
                return user;
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
                {
                    name: 1,
                    email: 1,
                    phone: 1,
                    address: 1,
                    businessLicense: 1,
                    status: 1,
                },
            );

        return {
            results: paginatedResults.results,
            pagination: {
                currentPage: paginatedResults.currentPage,
                totalPages: paginatedResults.totalPages,
                limit: paginatedResults.limit,
            },
        };
    }

    public async fetchRestaurantById(userId: string): Promise<IRestaurant> {
        return withCachedData(
            CACHE_KEYS.RESTAURANT_BY_ID(userId),
            async () => {
                const restaurant = await this.restaurant.findById(userId);
                if (!restaurant)
                    throw new ResourceNotFound('Restaurant not found');
                return restaurant;
            },
            CACHE_TTL.ONE_HOUR,
        );
    }

    public async deleteRestaurant(userId: string): Promise<IRestaurant> {
        const restaurant = await this.restaurant.findByIdAndDelete(userId);
        if (!restaurant) {
            throw new ResourceNotFound('Restaurant not found');
        }

        await Promise.all([
            deleteCacheData(CACHE_KEYS.RESTAURANT_BY_ID(userId)),
            deleteCacheData(CACHE_KEYS.ALL_RESTAURANTS),
        ]);
        return restaurant;
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
            { name: 1, email: 1, phone: 1, address: 1, status: 1 },
        );

        return {
            results: paginatedResults.results,
            pagination: {
                currentPage: paginatedResults.currentPage,
                totalPages: paginatedResults.totalPages,
                limit: paginatedResults.limit,
            },
        };
    }

    public async fetchRiderById(userId: string): Promise<IRider> {
        return withCachedData(
            CACHE_KEYS.RIDER_BY_ID(userId),
            async () => {
                const rider = await this.rider.findById(userId);
                if (!rider) throw new ResourceNotFound('Rider not found');
                return rider;
            },
            CACHE_TTL.ONE_HOUR,
        );
    }

    public async deleteRider(userId: string): Promise<IRider> {
        const rider = await this.rider.findByIdAndDelete(userId);
        if (!rider) {
            throw new ResourceNotFound('Rider not found');
        }

        await Promise.all([
            deleteCacheData(CACHE_KEYS.RIDER_BY_ID(userId)),
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
            { name: 1, email: 1, address: 1, status: 1 },
        );

        return {
            results: paginatedResults.results,
            pagination: {
                currentPage: paginatedResults.currentPage,
                totalPages: paginatedResults.totalPages,
                limit: paginatedResults.limit,
            },
        };
    }

    public async fetchOrdersById(userId: string): Promise<IOrder> {
        return withCachedData(
            CACHE_KEYS.ORDER_BY_ID(userId),
            async () => {
                const order = await this.order.findById(userId);
                if (!order) throw new ResourceNotFound('Order not found');
                return order;
            },
            CACHE_TTL.ONE_HOUR,
        );
    }

    public async deleteOrder(userId: string): Promise<IOrder> {
        const order = await this.order.findByIdAndDelete(userId);
        if (!order) {
            throw new ResourceNotFound('Order not found');
        }

        await Promise.all([
            deleteCacheData(CACHE_KEYS.ORDER_BY_ID(userId)),
            deleteCacheData(CACHE_KEYS.ALL_ORDERS),
        ]);
        return order;
    }
}
