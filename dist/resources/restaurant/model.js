"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const index_1 = require("@/config/index");
const index_2 = require("@/utils/index");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const index_3 = require("@/utils/index");
const restaurantSchema = new mongoose_1.Schema({
    name: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        trim: true,
    },
    address: {
        street: String,
        city: String,
        state: String,
    },
    cuisine: [String],
    operatingHours: [
        {
            day: String,
            open: String,
            close: String,
        },
    ],
    deliveryRadius: Number,
    rating: Number,
    status: String, // 'active', 'pending', 'suspended'
    bankInfo: {
        accountNumber: String,
        bankName: String,
        accountHolder: String,
    },
    password: {
        type: String,
        required: true,
    },
    ownerId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User' },
    role: {
        type: String,
        default: 'restaurant_owner',
    },
    phone: { type: String },
    businessLicense: { imageId: String, imageUrl: String },
    isEmailVerified: { type: Boolean, default: false },
    googleId: { type: String, trim: true },
    isLocked: { type: Boolean, default: false },
    failedLoginAttempts: { type: Number, default: 0 },
    emailVerificationOTP: {
        otp: String,
        expiresAt: Date,
        verificationToken: String,
        attempts: { type: Number, default: 0 },
    },
    lastPasswordChange: Date,
    passwordHistory: [
        {
            password: String,
            changedAt: Date,
        },
    ],
}, { timestamps: true });
restaurantSchema.pre('save', async function (next) {
    if (!this.isModified('password')) {
        return next();
    }
    const hash = await bcryptjs_1.default.genSalt(10);
    this.password = await bcryptjs_1.default.hash(this.password, hash);
    next();
});
restaurantSchema.methods.comparePassword = async function (password) {
    return await bcryptjs_1.default.compare(password, this.password);
};
restaurantSchema.methods.generateEmailVerificationOTP =
    async function () {
        const { otp, hashedOTP } = await (0, index_3.generateOTP)();
        const verificationToken = index_2.TokenService.createEmailVerificationToken({
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
exports.default = (0, mongoose_1.model)('Restaurant', restaurantSchema);
//# sourceMappingURL=model.js.map