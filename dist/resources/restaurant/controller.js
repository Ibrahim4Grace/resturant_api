"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const validation_1 = __importDefault(require("@/resources/restaurant/validation"));
const service_1 = require("@/resources/restaurant/service");
const index_1 = require("@/utils/index");
const index_2 = require("@/config/index");
const model_1 = __importDefault(require("@/resources/restaurant/model"));
const index_3 = require("@/middlewares/index");
class RestaurantController {
    constructor() {
        this.authPath = '/auth/restaurants';
        this.path = '/restaurant';
        this.router = (0, express_1.Router)();
        this.restaurantService = new service_1.RestaurantService();
        this.register = (0, index_3.asyncHandler)(async (req, res) => {
            const { name, email, password, phone, street, city, state } = req.body;
            const address = { street, city, state };
            const registrationData = {
                name,
                email,
                password,
                address,
                phone,
                businessLicense: '',
            };
            const result = await this.restaurantService.register(registrationData, req.file);
            (0, index_3.sendJsonResponse)(res, 201, 'Registration initiated. Please verify your email with the OTP sent.', result);
        });
        this.registrationOTP = (0, index_3.asyncHandler)(async (req, res) => {
            const { otp } = req.body;
            const authHeader = req.headers.authorization;
            if (!authHeader || !authHeader.startsWith('Bearer ')) {
                throw new index_3.BadRequest('Authorization token is required');
            }
            if (!otp) {
                throw new index_3.BadRequest('OTP code is required');
            }
            const token = authHeader.split(' ')[1];
            const decoded = await index_1.TokenService.verifyEmailToken(token);
            const user = await this.restaurantService.verifyRegistrationOTP(decoded.userId.toString(), otp);
            (0, index_3.sendJsonResponse)(res, 200, 'Email verified successfully. You can now log in.');
        });
        this.forgotPassword = (0, index_3.asyncHandler)(async (req, res) => {
            const { email } = req.body;
            const resetToken = await this.restaurantService.forgotPassword(email);
            (0, index_3.sendJsonResponse)(res, 200, 'Reset token generated and OTP sent to your email.', resetToken);
        });
        this.resetPasswordOTP = (0, index_3.asyncHandler)(async (req, res) => {
            const authHeader = req.headers.authorization;
            if (!authHeader || !authHeader.startsWith('Bearer ')) {
                throw new index_3.BadRequest('Authorization token is required');
            }
            const resetToken = authHeader.split(' ')[1];
            const { otp } = req.body;
            if (!otp) {
                throw new index_3.BadRequest('OTP is required');
            }
            await this.restaurantService.verifyResetPasswordOTP(resetToken, otp);
            (0, index_3.sendJsonResponse)(res, 200, 'OTP verified successfully. You can now reset your password.');
        });
        this.resetPassword = (0, index_3.asyncHandler)(async (req, res) => {
            const authHeader = req.headers.authorization;
            if (!authHeader || !authHeader.startsWith('Bearer ')) {
                throw new index_3.BadRequest('Authorization token is required');
            }
            const resetToken = authHeader.split(' ')[1];
            const { newPassword } = req.body;
            if (!newPassword) {
                throw new index_3.BadRequest('New password is required');
            }
            await this.restaurantService.resetPassword(resetToken, newPassword);
            (0, index_3.sendJsonResponse)(res, 200, 'Password reset successfully.');
        });
        this.login = (0, index_3.asyncHandler)(async (req, res) => {
            const credentials = req.body;
            const result = await this.restaurantService.login(credentials);
            (0, index_3.sendJsonResponse)(res, 200, 'Login successful', result);
        });
        this.createRestaurant = (0, index_3.asyncHandler)(async (req, res) => {
            const user = req.user;
            if (!user) {
                throw new index_3.Unauthorized('User not authenticated');
            }
            const userId = user.id;
            const { name, password, phone, street, city, state } = req.body;
            const address = { street, city, state };
            const registrationData = {
                name,
                email: user.email,
                phone,
                password,
                ownerId: userId,
                address,
                businessLicense: '',
                isEmailVerified: true,
            };
            const result = await this.restaurantService.createRestaurant(registrationData, req.file);
            (0, index_3.sendJsonResponse)(res, 201, 'Restaurant successfully created', result);
        });
        this.getRestaurant = (0, index_3.asyncHandler)(async (req, res) => {
            const restaurantId = req.currentUser?._id;
            if (!restaurantId) {
                throw new index_3.ResourceNotFound('Restaurant not found');
            }
            const restaurant = await this.restaurantService.getRestaurant(restaurantId);
            (0, index_3.sendJsonResponse)(res, 200, 'Restaurant retrieved successfully', restaurant);
        });
        this.updateRestaurant = (0, index_3.asyncHandler)(async (req, res) => {
            const restaurantId = req.currentUser?._id;
            if (!restaurantId) {
                throw new index_3.ResourceNotFound('Restaurant not found');
            }
            // Transform the request body
            const { street, city, state, ...rest } = req.body;
            const updateData = {
                ...rest,
                address: { street, city, state },
            };
            const updatedRestaurant = await this.restaurantService.updateRestaurant(restaurantId, updateData);
            if (!updatedRestaurant) {
                throw new index_3.ResourceNotFound('Restaurant not found or update failed');
            }
            (0, index_3.sendJsonResponse)(res, 200, 'Restaurant data updated successfully', updatedRestaurant);
        });
        this.initializeRoutes();
    }
    initializeRoutes() {
        this.router.post(`${this.authPath}/register`, index_2.upload.single('images'), (0, index_3.validateData)(validation_1.default.registerSchema), this.register);
        this.router.post(`${this.authPath}/verify-otp`, (0, index_3.validateData)(validation_1.default.verifyOtpSchema), (0, index_3.asyncHandler)(this.registrationOTP));
        this.router.post(`${this.authPath}/forgot`, (0, index_3.validateData)(validation_1.default.forgetPwdSchema), (0, index_3.asyncHandler)(this.forgotPassword));
        this.router.post(`${this.authPath}/password/verify-otp`, (0, index_3.validateData)(validation_1.default.verifyOtpSchema), (0, index_3.asyncHandler)(this.resetPasswordOTP));
        this.router.post(`${this.authPath}/password/reset`, (0, index_3.validateData)(validation_1.default.resetPasswordSchema), (0, index_3.asyncHandler)(this.resetPassword));
        this.router.post(`${this.authPath}/login`, (0, index_3.validateData)(validation_1.default.loginSchema), (0, index_3.asyncHandler)(this.login));
        this.router.post(`${this.path}/register`, (0, index_3.authMiddleware)(), index_2.upload.single('images'), (0, index_3.validateData)(validation_1.default.createSchema), this.createRestaurant);
        this.router.get(`${this.path}`, (0, index_3.authMiddleware)(), (0, index_3.authMiddleware)(), (0, index_3.authorization)(model_1.default, ['restaurant_owner']), this.getRestaurant);
        this.router.put(`${this.path}`, (0, index_3.authMiddleware)(), (0, index_3.authorization)(model_1.default, ['restaurant_owner']), (0, index_3.validateData)(validation_1.default.updateSchema), this.updateRestaurant);
    }
}
exports.default = RestaurantController;
//# sourceMappingURL=controller.js.map