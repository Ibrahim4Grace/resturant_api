"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminService = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const admin_model_1 = __importDefault(require("@/resources/admin/admin-model"));
const user_model_1 = __importDefault(require("@/resources/user/user-model"));
const model_1 = __importDefault(require("@/resources/restaurant/model"));
const rider_model_1 = __importDefault(require("@/resources/rider/rider-model"));
const order_model_1 = __importDefault(require("@/resources/order/order-model"));
const admin_email_template_1 = require("@/resources/admin/admin-email-template");
const index_1 = require("@/utils/index");
const index_2 = require("@/middlewares/index");
class AdminService {
    constructor() {
        this.admin = admin_model_1.default;
        this.user = user_model_1.default;
        this.restaurant = model_1.default;
        this.rider = rider_model_1.default;
        this.order = order_model_1.default;
        this.CACHE_KEYS = {
            ALL_ADMINS: 'all_admins',
            ADMIN_BY_ID: (id) => `admin:${id}`,
            ALL_USERS: 'all_users',
            USER_BY_ID: (id) => `user:${id}`,
            ALL_RESTAURANTS: 'all_restaurants',
            RESTAURANT_BY_ID: (id) => `restaurant:${id}`,
            ALL_RIDERS: 'all_riders',
            RIDER_BY_ID: (id) => `rider:${id}`,
            ALL_ORDERS: 'all_orders',
            ORDER_BY_ID: (id) => `order:${id}`,
        };
    }
    async checkDuplicate(field, value) {
        const existingUser = await this.admin.findOne({ [field]: value });
        if (existingUser) {
            throw new index_2.Conflict(`${field === 'email' ? 'Email' : 'Phone Number'} already registered!`);
        }
    }
    adminData(admin) {
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
    async register(adminData) {
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
        const emailOptions = (0, admin_email_template_1.sendOTPByEmail)(admin, otp);
        await index_1.EmailQueueService.addEmailToQueue(emailOptions);
        return {
            admin: this.adminData(admin),
            verificationToken: verificationToken,
        };
    }
    async verifyRegistrationOTP(userId, otp) {
        const admin = await this.admin.findOne({
            _id: userId,
            isEmailVerified: false,
            'emailVerificationOTP.expiresAt': { $gt: new Date() },
        });
        if (!admin) {
            throw new index_2.BadRequest('Invalid or expired verification session');
        }
        if (!admin?.emailVerificationOTP?.otp) {
            throw new index_2.BadRequest('No OTP found for this admin');
        }
        if (new Date() > admin.emailVerificationOTP.expiresAt) {
            throw new index_2.BadRequest('OTP has expired');
        }
        const isValid = await bcryptjs_1.default.compare(otp, admin.emailVerificationOTP.otp.toString());
        if (!isValid) {
            throw new index_2.BadRequest('Invalid OTP');
        }
        admin.emailVerificationOTP = undefined;
        admin.isEmailVerified = true;
        await admin.save();
        const emailOptions = (0, admin_email_template_1.welcomeEmail)(admin);
        await index_1.EmailQueueService.addEmailToQueue(emailOptions);
        return admin;
    }
    async forgotPassword(email) {
        const admin = await this.admin.findOne({
            email: email.toLowerCase().trim(),
        });
        if (!admin) {
            throw new index_2.ResourceNotFound('Admin not found');
        }
        const verificationResult = await admin.generateEmailVerificationOTP();
        const { otp, verificationToken } = verificationResult;
        await admin.save();
        const emailOptions = (0, admin_email_template_1.sendOTPByEmail)(admin, otp);
        await index_1.EmailQueueService.addEmailToQueue(emailOptions);
        return verificationToken;
    }
    async verifyResetPasswordOTP(verificationToken, otp) {
        const admin = await this.admin.findOne({
            'emailVerificationOTP.verificationToken': verificationToken,
            'emailVerificationOTP.expiresAt': { $gt: new Date() },
        });
        if (!admin) {
            throw new index_2.BadRequest('Invalid or expired reset token');
        }
        if (!admin.emailVerificationOTP?.otp) {
            throw new index_2.BadRequest('No OTP found for this admin');
        }
        if (new Date() > admin.emailVerificationOTP.expiresAt) {
            throw new index_2.BadRequest('OTP has expired');
        }
        const isValid = await bcryptjs_1.default.compare(otp, admin.emailVerificationOTP.otp.toString());
        if (!isValid) {
            throw new index_2.BadRequest('Invalid OTP');
        }
        return admin;
    }
    async resetPassword(verificationToken, newPassword) {
        const admin = await this.admin.findOne({
            'emailVerificationOTP.verificationToken': verificationToken,
            'emailVerificationOTP.expiresAt': { $gt: new Date() },
        });
        if (!admin) {
            throw new index_2.BadRequest('Invalid or expired reset token');
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
        const emailOptions = (0, admin_email_template_1.PasswordResetEmail)(admin);
        await index_1.EmailQueueService.addEmailToQueue(emailOptions);
    }
    async login(credentials) {
        const admin = await this.admin.findOne({
            email: credentials.email,
        });
        if (!admin) {
            throw new index_2.ResourceNotFound('Invalid email or password');
        }
        if (!admin.isEmailVerified) {
            throw new index_2.Forbidden('Verify your email before sign in.');
        }
        const isValid = await admin.comparePassword(credentials.password);
        if (!isValid) {
            admin.failedLoginAttempts += 1;
            if (admin.failedLoginAttempts >= 3) {
                admin.isLocked = true;
                await admin.save();
                throw new index_2.Forbidden('Your account has been locked due to multiple failed login attempts. Please reset your password.');
            }
            await admin.save();
            throw new index_2.Unauthorized('Invalid email or password');
        }
        admin.failedLoginAttempts = 0;
        await admin.save();
        const requestedRole = credentials.role || 'admin';
        if (!admin.role.includes(requestedRole)) {
            throw new index_2.Forbidden(`You do not have permission to sign in as ${requestedRole}`);
        }
        const token = index_1.TokenService.createAuthToken({
            userId: admin._id,
            role: admin.role,
        });
        return {
            admin: this.adminData(admin),
            token,
        };
    }
    async fetchAllAdmins(req, res) {
        const paginatedResults = await (0, index_1.getPaginatedAndCachedResults)(req, res, this.admin, this.CACHE_KEYS.ALL_ADMINS, { name: 1, email: 1, address: 1, phone: 1, role: 1 });
        return {
            results: paginatedResults.results,
            pagination: {
                currentPage: paginatedResults.currentPage,
                totalPages: paginatedResults.totalPages,
                limit: paginatedResults.limit,
            },
        };
    }
    async fetchAdminsById(userId) {
        return (0, index_1.withCachedData)(this.CACHE_KEYS.ADMIN_BY_ID(userId), async () => {
            const admin = await this.admin.findById(userId);
            if (!admin)
                throw new index_2.ResourceNotFound('Admin not found');
            return admin;
        }, index_1.CACHE_TTL.ONE_HOUR);
    }
    async deletedAdmin(userId) {
        const admin = await this.admin.findByIdAndDelete(userId);
        if (!admin) {
            throw new index_2.ResourceNotFound('Admin not found');
        }
        await Promise.all([
            (0, index_1.deleteCacheData)(this.CACHE_KEYS.ADMIN_BY_ID(userId)),
            (0, index_1.deleteCacheData)(this.CACHE_KEYS.ALL_ADMINS),
        ]);
        return admin;
    }
    async fetchAllUsers(req, res) {
        const paginatedResults = await (0, index_1.getPaginatedAndCachedResults)(req, res, this.user, this.CACHE_KEYS.ALL_USERS, { name: 1, email: 1, addresses: 1, phone: 1, status: 1 });
        return {
            results: paginatedResults.results,
            pagination: {
                currentPage: paginatedResults.currentPage,
                totalPages: paginatedResults.totalPages,
                limit: paginatedResults.limit,
            },
        };
    }
    async fetchUserById(userId) {
        return (0, index_1.withCachedData)(this.CACHE_KEYS.USER_BY_ID(userId), async () => {
            const user = await this.user.findById(userId);
            if (!user)
                throw new index_2.ResourceNotFound('User not found');
            return user;
        }, index_1.CACHE_TTL.ONE_HOUR);
    }
    async deleteUser(userId) {
        const user = await this.user.findByIdAndDelete(userId);
        if (!user) {
            throw new index_2.ResourceNotFound('User not found');
        }
        await Promise.all([
            (0, index_1.deleteCacheData)(this.CACHE_KEYS.USER_BY_ID(userId)),
            (0, index_1.deleteCacheData)(this.CACHE_KEYS.ALL_USERS),
        ]);
        return user;
    }
    async fetchAllRestaurants(req, res) {
        const paginatedResults = await (0, index_1.getPaginatedAndCachedResults)(req, res, this.restaurant, this.CACHE_KEYS.ALL_RESTAURANTS, {
            name: 1,
            email: 1,
            phone: 1,
            address: 1,
            businessLicense: 1,
            status: 1,
        });
        return {
            results: paginatedResults.results,
            pagination: {
                currentPage: paginatedResults.currentPage,
                totalPages: paginatedResults.totalPages,
                limit: paginatedResults.limit,
            },
        };
    }
    async fetchRestaurantById(userId) {
        return (0, index_1.withCachedData)(this.CACHE_KEYS.RESTAURANT_BY_ID(userId), async () => {
            const restaurant = await this.restaurant.findById(userId);
            if (!restaurant)
                throw new index_2.ResourceNotFound('Restaurant not found');
            return restaurant;
        }, index_1.CACHE_TTL.ONE_HOUR);
    }
    async deleteRestaurant(userId) {
        const restaurant = await this.restaurant.findByIdAndDelete(userId);
        if (!restaurant) {
            throw new index_2.ResourceNotFound('Restaurant not found');
        }
        await Promise.all([
            (0, index_1.deleteCacheData)(this.CACHE_KEYS.RESTAURANT_BY_ID(userId)),
            (0, index_1.deleteCacheData)(this.CACHE_KEYS.ALL_RESTAURANTS),
        ]);
        return restaurant;
    }
    async fetchAllRiders(req, res) {
        const paginatedResults = await (0, index_1.getPaginatedAndCachedResults)(req, res, this.rider, this.CACHE_KEYS.ALL_RIDERS, { name: 1, email: 1, phone: 1, address: 1, status: 1 });
        return {
            results: paginatedResults.results,
            pagination: {
                currentPage: paginatedResults.currentPage,
                totalPages: paginatedResults.totalPages,
                limit: paginatedResults.limit,
            },
        };
    }
    async fetchRiderById(userId) {
        return (0, index_1.withCachedData)(this.CACHE_KEYS.RIDER_BY_ID(userId), async () => {
            const rider = await this.rider.findById(userId);
            if (!rider)
                throw new index_2.ResourceNotFound('Rider not found');
            return rider;
        }, index_1.CACHE_TTL.ONE_HOUR);
    }
    async deleteRider(userId) {
        const rider = await this.rider.findByIdAndDelete(userId);
        if (!rider) {
            throw new index_2.ResourceNotFound('Rider not found');
        }
        await Promise.all([
            (0, index_1.deleteCacheData)(this.CACHE_KEYS.RIDER_BY_ID(userId)),
            (0, index_1.deleteCacheData)(this.CACHE_KEYS.ALL_RIDERS),
        ]);
        return rider;
    }
    async fetchAllOrders(req, res) {
        const paginatedResults = await (0, index_1.getPaginatedAndCachedResults)(req, res, this.order, this.CACHE_KEYS.ALL_ORDERS, { name: 1, email: 1, address: 1, status: 1 });
        return {
            results: paginatedResults.results,
            pagination: {
                currentPage: paginatedResults.currentPage,
                totalPages: paginatedResults.totalPages,
                limit: paginatedResults.limit,
            },
        };
    }
    async fetchOrdersById(userId) {
        return (0, index_1.withCachedData)(this.CACHE_KEYS.ORDER_BY_ID(userId), async () => {
            const order = await this.order.findById(userId);
            if (!order)
                throw new index_2.ResourceNotFound('Order not found');
            return order;
        }, index_1.CACHE_TTL.ONE_HOUR);
    }
    async deleteOrder(userId) {
        const order = await this.order.findByIdAndDelete(userId);
        if (!order) {
            throw new index_2.ResourceNotFound('Order not found');
        }
        await Promise.all([
            (0, index_1.deleteCacheData)(this.CACHE_KEYS.ORDER_BY_ID(userId)),
            (0, index_1.deleteCacheData)(this.CACHE_KEYS.ALL_ORDERS),
        ]);
        return order;
    }
}
exports.AdminService = AdminService;
//# sourceMappingURL=admin-service.js.map