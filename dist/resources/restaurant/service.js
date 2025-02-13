"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RestaurantService = void 0;
const model_1 = __importDefault(require("@/resources/restaurant/model"));
const user_model_1 = __importDefault(require("@/resources/user/user-model"));
const index_1 = require("@/config/index");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const email_template_1 = require("@/resources/restaurant/email-template");
const index_2 = require("@/utils/index");
const index_3 = require("@/middlewares/index");
class RestaurantService {
    constructor() {
        this.restaurant = model_1.default;
        this.user = user_model_1.default;
        this.CACHE_KEYS = {
            ALL_RESTAURANTS: 'all_restaurants',
            RESTAURANT_BY_ID: (id) => `restaurant:${id}`,
        };
        this.cloudinaryService = new index_1.CloudinaryService();
    }
    async checkDuplicateEmail(email) {
        const existingRestaurant = await this.restaurant.findOne({ email });
        if (existingRestaurant) {
            throw new index_3.Conflict('Email already registered!');
        }
    }
    async checkDuplicatePhone(phone) {
        const existingRestaurant = await this.restaurant.findOne({ phone });
        if (existingRestaurant) {
            throw new index_3.Conflict('Phone number already registered!');
        }
    }
    async checkDuplicateAddress(address) {
        if (!address)
            return;
        const duplicateAddress = await this.restaurant.findOne({
            'address.street': address.street,
            'address.city': address.city,
            'address.state': address.state,
        });
        if (duplicateAddress) {
            throw new index_3.Conflict('Duplicate address: This address already exists.');
        }
    }
    sanitizeRestaurant(restaurant) {
        return {
            _id: restaurant._id,
            name: restaurant.name,
            email: restaurant.email,
            phone: restaurant.phone,
            address: restaurant.address,
            cuisine: restaurant.cuisine,
            status: restaurant.status,
            operatingHours: restaurant.operatingHours,
            createdAt: restaurant.createdAt,
            updatedAt: restaurant.updatedAt,
        };
    }
    async register(restaurantData, file) {
        // Validate unique constraints
        await Promise.all([
            this.checkDuplicateEmail(restaurantData.email),
            this.checkDuplicatePhone(restaurantData.phone),
            this.checkDuplicateAddress(restaurantData.address),
        ]);
        // Create a user account for the unauthenticated user
        const user = await this.user.create({
            name: restaurantData.name,
            email: restaurantData.email,
            password: restaurantData.password,
            phone: restaurantData.phone,
            isEmailVerified: true,
        });
        let businessLicense;
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
        const verificationResult = await restaurant.generateEmailVerificationOTP();
        const { otp, verificationToken } = verificationResult;
        await restaurant.save();
        const emailOptions = (0, email_template_1.sendOTPByEmail)(restaurant, otp);
        await index_2.EmailQueueService.addEmailToQueue(emailOptions);
        return {
            restaurant: this.sanitizeRestaurant(restaurant),
            verificationToken,
        };
    }
    async verifyRegistrationOTP(userId, otp) {
        const restaurant = await this.restaurant.findOne({
            _id: userId,
            isEmailVerified: false,
            'emailVerificationOTP.expiresAt': { $gt: new Date() },
        });
        if (!restaurant) {
            throw new index_3.BadRequest('Invalid or expired verification session');
        }
        if (!restaurant?.emailVerificationOTP?.otp) {
            throw new index_3.BadRequest('No OTP found for this restaurant');
        }
        if (new Date() > restaurant.emailVerificationOTP.expiresAt) {
            throw new index_3.BadRequest('OTP has expired');
        }
        const isValid = await bcryptjs_1.default.compare(otp, restaurant.emailVerificationOTP.otp.toString());
        if (!isValid) {
            throw new index_3.BadRequest('Invalid OTP');
        }
        restaurant.emailVerificationOTP = undefined;
        restaurant.isEmailVerified = true;
        await restaurant.save();
        const emailOptions = (0, email_template_1.pendingVerificationEmail)(restaurant);
        await index_2.EmailQueueService.addEmailToQueue(emailOptions);
        return restaurant;
    }
    async forgotPassword(email) {
        const restaurant = await this.restaurant.findOne({
            email: email.toLowerCase().trim(),
        });
        if (!restaurant) {
            throw new index_3.ResourceNotFound('Restaurant not found');
        }
        const verificationResult = await restaurant.generateEmailVerificationOTP();
        const { otp, verificationToken } = verificationResult;
        await restaurant.save();
        const emailOptions = (0, email_template_1.sendOTPByEmail)(restaurant, otp);
        await index_2.EmailQueueService.addEmailToQueue(emailOptions);
        return verificationToken;
    }
    async verifyResetPasswordOTP(verificationToken, otp) {
        const restaurant = await this.restaurant.findOne({
            'emailVerificationOTP.verificationToken': verificationToken,
            'emailVerificationOTP.expiresAt': { $gt: new Date() },
        });
        if (!restaurant) {
            throw new index_3.BadRequest('Invalid or expired reset token');
        }
        if (!restaurant.emailVerificationOTP?.otp) {
            throw new index_3.BadRequest('No OTP found for this restaurant');
        }
        if (new Date() > restaurant.emailVerificationOTP.expiresAt) {
            throw new index_3.BadRequest('OTP has expired');
        }
        const isValid = await bcryptjs_1.default.compare(otp, restaurant.emailVerificationOTP.otp.toString());
        if (!isValid) {
            throw new index_3.BadRequest('Invalid OTP');
        }
        return restaurant;
    }
    async resetPassword(verificationToken, newPassword) {
        const restaurant = await this.restaurant.findOne({
            'emailVerificationOTP.verificationToken': verificationToken,
            'emailVerificationOTP.expiresAt': { $gt: new Date() },
        });
        if (!restaurant) {
            throw new index_3.BadRequest('Invalid or expired reset token');
        }
        restaurant.passwordHistory = restaurant.passwordHistory ?? [];
        restaurant.passwordHistory.push({
            password: restaurant.password,
            changedAt: new Date(),
        });
        restaurant.password = newPassword;
        restaurant.emailVerificationOTP = undefined;
        await restaurant.save();
        const emailOptions = (0, email_template_1.PasswordResetEmail)(restaurant);
        await index_2.EmailQueueService.addEmailToQueue(emailOptions);
    }
    async login(credentials) {
        const restaurant = await this.restaurant.findOne({
            email: credentials.email,
        });
        if (!restaurant) {
            throw new index_3.ResourceNotFound('Invalid email or password');
        }
        if (!restaurant.isEmailVerified) {
            throw new index_3.Forbidden('Verify your email before sign in.');
        }
        if (restaurant.status !== 'active') {
            throw new index_3.Forbidden('Your account is not active. Please contact support or wait for approval.');
        }
        const isValid = await restaurant.comparePassword(credentials.password);
        if (!isValid) {
            restaurant.failedLoginAttempts += 1;
            if (restaurant.failedLoginAttempts >= 3) {
                restaurant.isLocked = true;
                await restaurant.save();
                throw new index_3.Forbidden('Your account has been locked due to multiple failed login attempts. Please reset your password.');
            }
            await restaurant.save();
            throw new index_3.Unauthorized('Invalid email or password');
        }
        restaurant.failedLoginAttempts = 0;
        await restaurant.save();
        const requestedRole = 'restaurant_owner';
        if (!restaurant.role.includes(requestedRole)) {
            throw new index_3.Forbidden(`You do not have permission to sign in as ${requestedRole}`);
        }
        const token = index_2.TokenService.createAuthToken({
            userId: restaurant._id,
            role: requestedRole,
        });
        return {
            restaurant: this.sanitizeRestaurant(restaurant),
            token,
        };
    }
    async createRestaurant(restaurantData, file) {
        await Promise.all([
            this.checkDuplicateEmail(restaurantData.email),
            this.checkDuplicateAddress(restaurantData.address),
        ]);
        let businessLicense;
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
        const emailOptions = (0, email_template_1.pendingVerificationEmail)(restaurant);
        await index_2.EmailQueueService.addEmailToQueue(emailOptions);
        const restaurantToken = index_2.TokenService.createAuthToken({
            userId: restaurant._id,
            role: restaurant.role,
        });
        return {
            restaurant: this.sanitizeRestaurant(restaurant),
            token: restaurantToken,
        };
    }
    async getRestaurant(restaurantId) {
        const cacheKey = this.CACHE_KEYS.RESTAURANT_BY_ID(restaurantId);
        return (0, index_2.withCachedData)(cacheKey, async () => {
            const restaurant = await this.restaurant
                .findById(restaurantId)
                .lean();
            if (!restaurant) {
                throw new index_3.ResourceNotFound('Restaurant not found');
            }
            return this.sanitizeRestaurant(restaurant);
        }, index_2.CACHE_TTL.ONE_HOUR);
    }
    async updateRestaurant(restaurantId, data) {
        const restaurant = await this.restaurant.findOneAndUpdate({ _id: restaurantId }, { $set: data }, { new: true });
        if (!restaurant) {
            return null;
        }
        return this.sanitizeRestaurant(restaurant);
    }
}
exports.RestaurantService = RestaurantService;
//# sourceMappingURL=service.js.map