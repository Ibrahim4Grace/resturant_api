"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const index_1 = require("@/config/index");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const index_2 = require("@/utils/index");
const index_3 = require("@/utils/index");
const userSchema = new mongoose_1.Schema({
    name: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        trim: true,
    },
    password: {
        type: String,
        required: true,
    },
    role: {
        type: String,
        default: 'user',
    },
    addresses: [
        {
            street: { type: String, required: true },
            city: { type: String, required: true },
            state: { type: String, required: true },
        },
    ],
    paymentMethods: [
        {
            type: String, // 'credit_card', 'debit_card', etc.
            last4: String,
            expiryDate: Date,
            isDefault: Boolean,
        },
    ],
    phone: {
        type: String,
        required: true,
    },
    status: String, // 'active', 'suspended'
    image: { imageId: String, imageUrl: String },
    isEmailVerified: { type: Boolean, default: false },
    googleId: { type: String, trim: true },
    isLocked: { type: Boolean, default: false },
    failedLoginAttempts: { type: Number, default: 0 },
    emailVerificationOTP: {
        otp: String,
        expiresAt: Date,
        verificationToken: String,
    },
    lastPasswordChange: Date,
    passwordHistory: [
        {
            password: String,
            changedAt: Date,
        },
    ],
}, { timestamps: true });
//hashpassword
userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) {
        return next();
    }
    const hash = await bcryptjs_1.default.genSalt(10);
    this.password = await bcryptjs_1.default.hash(this.password, hash);
    next();
});
// Your password comparison logic
userSchema.methods.comparePassword = async function (password) {
    return await bcryptjs_1.default.compare(password, this.password);
};
userSchema.methods.generateEmailVerificationOTP = async function () {
    const { otp, hashedOTP } = await (0, index_2.generateOTP)();
    const verificationToken = index_3.TokenService.createEmailVerificationToken({
        userId: this._id,
        email: this.email,
    });
    this.emailVerificationOTP = {
        otp: hashedOTP,
        expiresAt: new Date(Date.now() + Number(index_1.config.OTP_EXPIRY)),
        verificationToken,
    };
    return { otp, verificationToken };
};
exports.default = (0, mongoose_1.model)('User', userSchema);
//# sourceMappingURL=user-model.js.map