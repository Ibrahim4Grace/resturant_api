"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserService = void 0;
const user_model_1 = __importDefault(require("@/resources/user/user-model"));
const order_model_1 = __importDefault(require("@/resources/order/order-model"));
const index_1 = require("@/utils/index");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const user_email_template_1 = require("@/resources/user/user-email-template");
const index_2 = require("@/middlewares/index");
class UserService {
    constructor() {
        this.user = user_model_1.default;
        this.order = order_model_1.default;
    }
    async checkDuplicate(field, value) {
        const existingUser = await this.user.findOne({ [field]: value });
        if (existingUser) {
            throw new index_2.Conflict(`${field === 'email' ? 'Email' : 'Phone Number'} already registered!`);
        }
    }
    async findUserByEmail(email) {
        return this.user.findOne({
            email: email.toLowerCase().trim(),
        });
    }
    async findUserById(userId) {
        const user = await this.user.findById(userId).lean();
        if (!user) {
            throw new index_2.ResourceNotFound('User not found');
        }
        return user;
    }
    async findUserByVerificationToken(verificationToken) {
        return this.user.findOne({
            'emailVerificationOTP.verificationToken': verificationToken,
            'emailVerificationOTP.expiresAt': { $gt: new Date() },
        });
    }
    userData(user) {
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
    orderData(order) {
        return {
            _id: order._id,
            status: order.status,
            total_price: order.total_price,
            userId: order.userId,
            restaurantId: order.restaurantId,
            items: order.items,
            subtotal: order.subtotal,
            tax: order.tax,
            delivery_fee: order.delivery_fee,
            delivery_info: order.delivery_info,
            createdAt: order.createdAt,
            updatedAt: order.updatedAt,
        };
    }
    async register(userData) {
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
        const emailOptions = (0, user_email_template_1.sendOTPByEmail)(user, otp);
        await index_1.EmailQueueService.addEmailToQueue(emailOptions);
        return {
            user: this.userData(user),
            verificationToken: verificationToken,
        };
    }
    async verifyRegistrationOTP(userId, otp) {
        const user = await this.user.findOne({
            _id: userId,
            isEmailVerified: false,
            'emailVerificationOTP.expiresAt': { $gt: new Date() },
        });
        if (!user) {
            throw new index_2.BadRequest('Invalid or expired verification session');
        }
        if (!user?.emailVerificationOTP?.otp) {
            throw new index_2.BadRequest('No OTP found for this user');
        }
        if (new Date() > user.emailVerificationOTP.expiresAt) {
            throw new index_2.BadRequest('OTP has expired');
        }
        const isValid = await bcryptjs_1.default.compare(otp, user.emailVerificationOTP.otp.toString());
        if (!isValid) {
            throw new index_2.BadRequest('Invalid OTP');
        }
        user.emailVerificationOTP = undefined;
        user.isEmailVerified = true;
        await user.save();
        const emailOptions = (0, user_email_template_1.welcomeEmail)(user);
        await index_1.EmailQueueService.addEmailToQueue(emailOptions);
        return user;
    }
    async forgotPassword(email) {
        const user = await this.findUserByEmail(email);
        if (!user) {
            throw new index_2.ResourceNotFound('User not found');
        }
        const verificationResult = await user.generateEmailVerificationOTP();
        const { otp, verificationToken } = verificationResult;
        await user.save();
        const emailOptions = (0, user_email_template_1.sendOTPByEmail)(user, otp);
        await index_1.EmailQueueService.addEmailToQueue(emailOptions);
        return verificationToken;
    }
    async verifyResetPasswordOTP(verificationToken, otp) {
        const user = await this.findUserByVerificationToken(verificationToken);
        if (!user) {
            throw new index_2.BadRequest('Invalid or expired reset token');
        }
        if (!user.emailVerificationOTP?.otp) {
            throw new index_2.BadRequest('No OTP found for this user');
        }
        if (new Date() > user.emailVerificationOTP.expiresAt) {
            throw new index_2.BadRequest('OTP has expired');
        }
        const isValid = await bcryptjs_1.default.compare(otp, user.emailVerificationOTP.otp.toString());
        if (!isValid) {
            throw new index_2.BadRequest('Invalid OTP');
        }
        return user;
    }
    async resetPassword(verificationToken, newPassword) {
        const user = await this.findUserByVerificationToken(verificationToken);
        if (!user) {
            throw new index_2.BadRequest('Invalid or expired reset token');
        }
        // Add the old password to history before updating
        user.passwordHistory = user.passwordHistory ?? [];
        const isPasswordUsedBefore = user.passwordHistory.some((entry) => bcryptjs_1.default.compareSync(newPassword, entry.password));
        if (isPasswordUsedBefore) {
            throw new index_2.BadRequest('This password has been used before. Please choose a new password.');
        }
        user.passwordHistory.push({
            password: user.password,
            changedAt: new Date(),
        });
        const PASSWORD_HISTORY_LIMIT = 5;
        if (user.passwordHistory.length > PASSWORD_HISTORY_LIMIT) {
            user.passwordHistory = user.passwordHistory.slice(-PASSWORD_HISTORY_LIMIT);
        }
        user.password = newPassword;
        user.emailVerificationOTP = undefined;
        user.failedLoginAttempts = 0;
        user.isLocked = false;
        await user.save();
        const emailOptions = (0, user_email_template_1.PasswordResetEmail)(user);
        await index_1.EmailQueueService.addEmailToQueue(emailOptions);
    }
    async login(credentials) {
        const user = await this.findUserByEmail(credentials.email);
        if (!user) {
            throw new index_2.ResourceNotFound('Invalid email or password');
        }
        if (!user.isEmailVerified) {
            throw new index_2.Forbidden('Verify your email before sign in.');
        }
        const isValid = await user.comparePassword(credentials.password);
        if (!isValid) {
            user.failedLoginAttempts += 1;
            if (user.failedLoginAttempts >= 3) {
                user.isLocked = true;
                await user.save();
                throw new index_2.Forbidden('Your account has been locked due to multiple failed login attempts. Please reset your password.');
            }
            await user.save();
            throw new index_2.Unauthorized('Invalid email or password');
        }
        user.failedLoginAttempts = 0;
        await user.save();
        const requestedRole = credentials.role || 'user';
        if (!user.role.includes(requestedRole)) {
            throw new index_2.Forbidden(`You do not have permission to sign in as ${requestedRole}`);
        }
        const token = index_1.TokenService.createAuthToken({
            userId: user._id.toString(),
            role: user.role,
        });
        return {
            user: this.userData(user),
            token,
        };
    }
    async getUserById(userId) {
        const user = await this.findUserById(userId);
        return this.userData(user);
    }
    async updateUserById(userId, data) {
        const user = await this.user.findOneAndUpdate({ _id: userId }, { $set: data }, { new: true });
        return user;
    }
    async addNewAddress(userId, addressData) {
        const user = await this.findUserById(userId);
        user.addresses = user.addresses || [];
        const isDuplicate = user.addresses.some((address) => address.street === addressData.street &&
            address.city === addressData.city &&
            address.state === addressData.state);
        if (isDuplicate) {
            throw new index_2.Conflict('Duplicate address: This address already exists.');
        }
        const emailOptions = (0, user_email_template_1.newAddressAdded)(user, addressData);
        await index_1.EmailQueueService.addEmailToQueue(emailOptions);
        user.addresses.push(addressData);
        await user.save();
        return user;
    }
    async getUserAddress(userId) {
        const user = await this.user
            .findById(userId)
            .select('addresses')
            .lean();
        if (!user) {
            throw new index_2.ResourceNotFound('User not found');
        }
        return user.addresses || [];
    }
    async deleteAddress(userId, addressId) {
        await this.findUserById(userId);
        const result = await this.user.findOneAndUpdate({ _id: userId, 'addresses._id': addressId }, { $pull: { addresses: { _id: addressId } } }, { new: true });
        if (!result) {
            throw new index_2.ResourceNotFound('Address not found');
        }
    }
    async getUserOrders(userId) {
        await this.findUserById(userId);
        const orders = await this.order
            .find({ userId })
            .sort({ createdAt: -1 })
            .lean();
        return orders.map((order) => this.orderData(order));
    }
    async getUserOrder(userId, orderId) {
        const order = await this.order
            .findOne({
            _id: orderId,
            userId: userId,
        })
            .lean();
        console.log('Finding order with:', { _id: orderId, userId });
        if (!order) {
            throw new index_2.ResourceNotFound('Order not found or does not belong to this user');
        }
        return this.orderData(order);
    }
}
exports.UserService = UserService;
//# sourceMappingURL=user-service.js.map