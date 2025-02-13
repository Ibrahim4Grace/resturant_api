"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const user_validation_1 = __importDefault(require("@/resources/user/user-validation"));
const user_service_1 = require("@/resources/user/user-service");
const user_model_1 = __importDefault(require("@/resources/user/user-model"));
const index_1 = require("@/utils/index");
const index_2 = require("@/middlewares/index");
class UserController {
    constructor() {
        this.authPath = '/auth/users';
        this.path = '/user';
        this.router = (0, express_1.Router)();
        this.userService = new user_service_1.UserService();
        this.register = (0, index_2.asyncHandler)(async (req, res) => {
            const { name, email, password, phone, street, city, state } = req.body;
            const addresses = { street, city, state };
            const registrationData = {
                name,
                email,
                password,
                phone,
                addresses,
            };
            const result = await this.userService.register(registrationData);
            (0, index_2.sendJsonResponse)(res, 201, 'Registration initiated. Please verify your email with the OTP sent.', result);
        });
        this.registrationOTP = (0, index_2.asyncHandler)(async (req, res) => {
            const { otp } = req.body;
            const authHeader = req.headers.authorization;
            if (!authHeader || !authHeader.startsWith('Bearer ')) {
                throw new index_2.BadRequest('Authorization token is required');
            }
            if (!otp) {
                throw new index_2.BadRequest('OTP code is required');
            }
            const token = authHeader.split(' ')[1];
            const decoded = await index_1.TokenService.verifyEmailToken(token);
            const user = await this.userService.verifyRegistrationOTP(decoded.userId.toString(), otp);
            (0, index_2.sendJsonResponse)(res, 200, 'Email verified successfully. You can now log in.');
        });
        this.forgotPassword = (0, index_2.asyncHandler)(async (req, res, next) => {
            const { email } = req.body;
            const resetToken = await this.userService.forgotPassword(email);
            (0, index_2.sendJsonResponse)(res, 200, 'Reset token generated and OTP sent to your email.', resetToken);
        });
        this.resetPasswordOTP = (0, index_2.asyncHandler)(async (req, res) => {
            const authHeader = req.headers.authorization;
            if (!authHeader || !authHeader.startsWith('Bearer ')) {
                throw new index_2.BadRequest('Authorization token is required');
            }
            const resetToken = authHeader.split(' ')[1];
            const { otp } = req.body;
            if (!otp) {
                throw new index_2.BadRequest('OTP is required');
            }
            await this.userService.verifyResetPasswordOTP(resetToken, otp);
            (0, index_2.sendJsonResponse)(res, 200, 'OTP verified successfully. You can now reset your password.');
        });
        this.resetPassword = (0, index_2.asyncHandler)(async (req, res) => {
            const authHeader = req.headers.authorization;
            if (!authHeader || !authHeader.startsWith('Bearer ')) {
                throw new index_2.BadRequest('Authorization token is required');
            }
            const resetToken = authHeader.split(' ')[1];
            const { newPassword } = req.body;
            if (!newPassword) {
                throw new index_2.BadRequest('New password is required');
            }
            await this.userService.resetPassword(resetToken, newPassword);
            (0, index_2.sendJsonResponse)(res, 200, 'Password reset successfully.');
        });
        this.login = (0, index_2.asyncHandler)(async (req, res) => {
            const { email, password } = req.body;
            const result = await this.userService.login({
                email,
                password,
            });
            (0, index_2.sendJsonResponse)(res, 200, 'Login successful', result);
        });
        this.getUser = (0, index_2.asyncHandler)(async (req, res) => {
            const userId = req.currentUser?._id;
            if (!userId) {
                throw new index_2.ResourceNotFound('User not found');
            }
            const user = await this.userService.getUserById(userId);
            (0, index_2.sendJsonResponse)(res, 200, 'User retrieved successfully', user);
        });
        this.updateUser = (0, index_2.asyncHandler)(async (req, res) => {
            const userId = req.currentUser?._id;
            if (!userId) {
                throw new index_2.ResourceNotFound('User not found');
            }
            const updateData = req.body;
            const updatedUser = await this.userService.updateUserById(userId, updateData);
            if (!updatedUser) {
                throw new index_2.ResourceNotFound('User not found or update failed');
            }
            (0, index_2.sendJsonResponse)(res, 200, 'User data updated successfully', updatedUser);
        });
        this.addNewAddress = (0, index_2.asyncHandler)(async (req, res) => {
            const userId = req.currentUser?._id;
            if (!userId)
                throw new index_2.ResourceNotFound('User not found');
            const { street, city, state } = req.body;
            const addressAdded = await this.userService.addNewAddress(userId, {
                street,
                city,
                state,
            });
            (0, index_2.sendJsonResponse)(res, 201, 'Address added successfully', {
                addressAdded,
            });
        });
        this.getUserAddress = (0, index_2.asyncHandler)(async (req, res) => {
            const userId = req.currentUser?._id;
            if (!userId)
                throw new index_2.ResourceNotFound('User not found');
            const addresses = await this.userService.getUserAddress(userId);
            (0, index_2.sendJsonResponse)(res, 200, 'Addresses retrieved successfully', addresses);
        });
        this.deleteAddress = (0, index_2.asyncHandler)(async (req, res) => {
            const userId = req.currentUser?._id;
            if (!userId)
                throw new index_2.ResourceNotFound('User not found');
            const addressId = req.params.id;
            await this.userService.deleteAddress(userId, addressId);
            (0, index_2.sendJsonResponse)(res, 200, 'Address deleted successfully');
        });
        this.getUserOrders = (0, index_2.asyncHandler)(async (req, res) => {
            const userId = req.currentUser?._id;
            if (!userId) {
                throw new index_2.ResourceNotFound('User not found');
            }
            const orders = await this.userService.getUserOrders(userId.toString());
            return (0, index_2.sendJsonResponse)(res, 200, 'Orders retrieved successfully', orders);
        });
        this.getUserOrder = (0, index_2.asyncHandler)(async (req, res) => {
            const userId = req.currentUser?._id;
            const orderId = req.params.orderId;
            if (!userId) {
                throw new index_2.ResourceNotFound('User not foundw');
            }
            const orders = await this.userService.getUserOrder(userId, orderId);
            (0, index_2.sendJsonResponse)(res, 200, 'Orders retrieved successfully', orders);
        });
        this.initializeRoutes();
    }
    initializeRoutes() {
        this.router.post(`${this.authPath}/register`, (0, index_2.validateData)(user_validation_1.default.registerSchema), this.register);
        this.router.post(`${this.authPath}/verify-otp`, (0, index_2.validateData)(user_validation_1.default.verifyOtpSchema), this.registrationOTP);
        this.router.post(`${this.authPath}/forgot`, (0, index_2.validateData)(user_validation_1.default.forgetPwdSchema), this.forgotPassword);
        this.router.post(`${this.authPath}/password/verify-otp`, (0, index_2.validateData)(user_validation_1.default.verifyOtpSchema), this.resetPasswordOTP);
        this.router.post(`${this.authPath}/password/reset`, (0, index_2.validateData)(user_validation_1.default.resetPasswordSchema), this.resetPassword);
        this.router.post(`${this.authPath}/login`, (0, index_2.validateData)(user_validation_1.default.loginSchema), this.login);
        this.router.get(`${this.path}/address`, (0, index_2.authMiddleware)(), (0, index_2.authorization)(user_model_1.default, ['user']), this.getUserAddress);
        this.router.get(`${this.path}`, (0, index_2.authMiddleware)(), (0, index_2.authorization)(user_model_1.default, ['user']), this.getUser);
        this.router.put(`${this.path}`, (0, index_2.authMiddleware)(), (0, index_2.authorization)(user_model_1.default, ['user']), (0, index_2.validateData)(user_validation_1.default.updateUserSchema), this.updateUser);
        this.router.post(`${this.path}/address`, (0, index_2.authMiddleware)(), (0, index_2.authorization)(user_model_1.default, ['user']), (0, index_2.validateData)(user_validation_1.default.addressesSchema), this.addNewAddress);
        this.router.delete(`${this.path}/address/:id`, (0, index_2.authMiddleware)(), (0, index_2.authorization)(user_model_1.default, ['user']), this.deleteAddress);
        this.router.get(`${this.path}/orders`, (0, index_2.authMiddleware)(), (0, index_2.authorization)(user_model_1.default, ['user']), this.getUserOrders);
        this.router.get(`${this.path}/orders/:orderId`, (0, index_2.authMiddleware)(), (0, index_2.authorization)(user_model_1.default, ['user']), this.getUserOrder);
    }
}
exports.default = UserController;
//# sourceMappingURL=user-controller.js.map