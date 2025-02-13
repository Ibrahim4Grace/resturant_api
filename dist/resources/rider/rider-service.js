"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RiderService = void 0;
const rider_model_1 = __importDefault(require("@/resources/rider/rider-model"));
const index_1 = require("@/utils/index");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const rider_email_template_1 = require("@/resources/rider/rider-email-template");
const index_2 = require("@/middlewares/index");
class RiderService {
    constructor() {
        this.rider = rider_model_1.default;
    }
    async register(riderData) {
        const existingRider = await this.rider.findOne({
            email: riderData.email,
        });
        if (existingRider) {
            throw new index_2.Conflict('Email already registered!');
        }
        const rider = await this.rider.create({
            ...riderData,
            isEmailVerified: false,
        });
        const verificationResult = await rider.generateEmailVerificationOTP();
        const { otp, verificationToken } = verificationResult;
        await rider.save();
        const emailOptions = (0, rider_email_template_1.sendOTPByEmail)(rider, otp);
        await index_1.EmailQueueService.addEmailToQueue(emailOptions);
        const sanitizedRider = {
            _id: rider._id,
            name: rider.name,
            email: rider.email,
            isEmailVerified: rider.isEmailVerified,
            createdAt: rider.createdAt,
            updatedAt: rider.updatedAt,
        };
        return {
            rider: sanitizedRider,
            verificationToken: verificationToken,
        };
    }
    async verifyRegistrationOTP(userId, otp) {
        const rider = await this.rider.findOne({
            _id: userId,
            isEmailVerified: false,
            'emailVerificationOTP.expiresAt': { $gt: new Date() },
        });
        if (!rider) {
            throw new index_2.BadRequest('Invalid or expired verification session');
        }
        if (!rider?.emailVerificationOTP?.otp) {
            throw new index_2.BadRequest('No OTP found for this rider');
        }
        if (new Date() > rider.emailVerificationOTP.expiresAt) {
            throw new index_2.BadRequest('OTP has expired');
        }
        const isValid = await bcryptjs_1.default.compare(otp, rider.emailVerificationOTP.otp.toString());
        if (!isValid) {
            throw new index_2.BadRequest('Invalid OTP');
        }
        rider.emailVerificationOTP = undefined;
        rider.isEmailVerified = true;
        await rider.save();
        const emailOptions = (0, rider_email_template_1.welcomeEmail)(rider);
        await index_1.EmailQueueService.addEmailToQueue(emailOptions);
        return rider;
    }
    async forgotPassword(email) {
        const rider = await this.rider.findOne({
            email: email.toLowerCase().trim(),
        });
        if (!rider) {
            throw new index_2.ResourceNotFound('Rider not found');
        }
        const verificationResult = await rider.generateEmailVerificationOTP();
        const { otp, verificationToken } = verificationResult;
        await rider.save();
        const emailOptions = (0, rider_email_template_1.sendOTPByEmail)(rider, otp);
        await index_1.EmailQueueService.addEmailToQueue(emailOptions);
        return verificationToken;
    }
    async verifyResetPasswordOTP(verificationToken, otp) {
        const rider = await this.rider.findOne({
            'emailVerificationOTP.verificationToken': verificationToken,
            'emailVerificationOTP.expiresAt': { $gt: new Date() },
        });
        if (!rider) {
            throw new index_2.BadRequest('Invalid or expired reset token');
        }
        if (!rider.emailVerificationOTP?.otp) {
            throw new index_2.BadRequest('No OTP found for this rider');
        }
        if (new Date() > rider.emailVerificationOTP.expiresAt) {
            throw new index_2.BadRequest('OTP has expired');
        }
        const isValid = await bcryptjs_1.default.compare(otp, rider.emailVerificationOTP.otp.toString());
        if (!isValid) {
            throw new index_2.BadRequest('Invalid OTP');
        }
        return rider;
    }
    async resetPassword(verificationToken, newPassword) {
        const rider = await this.rider.findOne({
            'emailVerificationOTP.verificationToken': verificationToken,
            'emailVerificationOTP.expiresAt': { $gt: new Date() },
        });
        if (!rider) {
            throw new index_2.BadRequest('Invalid or expired reset token');
        }
        rider.passwordHistory = rider.passwordHistory ?? [];
        rider.passwordHistory.push({
            password: rider.password,
            changedAt: new Date(),
        });
        rider.password = newPassword;
        rider.emailVerificationOTP = undefined;
        await rider.save();
        const emailOptions = (0, rider_email_template_1.PasswordResetEmail)(rider);
        await index_1.EmailQueueService.addEmailToQueue(emailOptions);
    }
}
exports.RiderService = RiderService;
//# sourceMappingURL=rider-service.js.map