"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const rider_validation_1 = __importDefault(require("@/resources/rider/rider-validation"));
const rider_service_1 = require("@/resources/rider/rider-service");
const index_1 = require("@/utils/index");
const index_2 = require("@/middlewares/index");
class RiderController {
    constructor() {
        this.authPath = "/auth/riders";
        this.path = "/riders";
        this.router = (0, express_1.Router)();
        this.riderService = new rider_service_1.RiderService();
        this.register = async (req, res, next) => {
            const { name, email, password, role } = req.body;
            const result = await this.riderService.register({
                name,
                email,
                password,
                role,
            });
            (0, index_2.sendJsonResponse)(res, 201, "Registration initiated. Please verify your email with the OTP sent.", result);
        };
        this.registrationOTP = async (req, res, next) => {
            const { otp } = req.body;
            const authHeader = req.headers.authorization;
            if (!authHeader || !authHeader.startsWith("Bearer ")) {
                throw new index_2.BadRequest("Authorization token is required");
            }
            if (!otp) {
                throw new index_2.BadRequest("OTP code is required");
            }
            const token = authHeader.split(" ")[1];
            const decoded = await index_1.TokenService.verifyEmailToken(token);
            const user = await this.riderService.verifyRegistrationOTP(decoded.userId.toString(), otp);
            (0, index_2.sendJsonResponse)(res, 200, "Email verified successfully. You can now log in.");
        };
        this.forgotPassword = async (req, res, next) => {
            const { email } = req.body;
            const resetToken = await this.riderService.forgotPassword(email);
            (0, index_2.sendJsonResponse)(res, 200, "Reset token generated and OTP sent to your email.", resetToken);
        };
        this.resetPasswordOTP = async (req, res, next) => {
            const authHeader = req.headers.authorization;
            if (!authHeader || !authHeader.startsWith("Bearer ")) {
                throw new index_2.BadRequest("Authorization token is required");
            }
            const resetToken = authHeader.split(" ")[1];
            const { otp } = req.body;
            if (!otp) {
                throw new index_2.BadRequest("OTP is required");
            }
            await this.riderService.verifyResetPasswordOTP(resetToken, otp);
            (0, index_2.sendJsonResponse)(res, 200, "OTP verified successfully. You can now reset your password.");
        };
        this.resetPassword = async (req, res, next) => {
            const authHeader = req.headers.authorization;
            if (!authHeader || !authHeader.startsWith("Bearer ")) {
                throw new index_2.BadRequest("Authorization token is required");
            }
            const resetToken = authHeader.split(" ")[1];
            const { newPassword } = req.body;
            if (!newPassword) {
                throw new index_2.BadRequest("New password is required");
            }
            await this.riderService.resetPassword(resetToken, newPassword);
            (0, index_2.sendJsonResponse)(res, 200, "Password reset successfully.");
        };
        this.initializeRoutes();
    }
    initializeRoutes() {
        this.router.post(`${this.authPath}/register`, (0, index_2.validateData)(rider_validation_1.default.register), (0, index_2.asyncHandler)(this.register));
        this.router.post(`${this.authPath}/verify-otp`, (0, index_2.validateData)(rider_validation_1.default.verifyOtp), (0, index_2.asyncHandler)(this.registrationOTP));
        this.router.post(`${this.authPath}/forgot`, (0, index_2.validateData)(rider_validation_1.default.forgetPwd), (0, index_2.asyncHandler)(this.forgotPassword));
        this.router.post(`${this.authPath}/password/verify-otp`, (0, index_2.validateData)(rider_validation_1.default.verifyOtp), (0, index_2.asyncHandler)(this.resetPasswordOTP));
        this.router.post(`${this.authPath}/password/reset`, (0, index_2.validateData)(rider_validation_1.default.resetPassword), (0, index_2.asyncHandler)(this.resetPassword));
    }
}
exports.default = RiderController;
//# sourceMappingURL=rider-controller.js.map