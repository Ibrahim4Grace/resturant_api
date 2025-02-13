"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const index_1 = require("@/config/index");
const index_2 = require("@/utils/index");
const index_3 = require("@/utils/index");
const riderSchema = new mongoose_1.Schema({
    name: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
    },
    password: {
        type: String,
        required: true,
    },
    roles: {
        type: [String],
        default: ['rider'],
    },
    address: {
        street: { type: String, required: true },
        city: { type: String, required: true },
        state: { type: String, required: true },
    },
    phone: {
        type: String,
        required: true,
    },
    vehicleType: String,
    vehicleNumber: String,
    licenseNumber: String,
    documents: [
        {
            type: String, // 'license', 'insurance', 'identity'
            url: String,
            verificationStatus: String,
        },
    ],
    currentLocation: {
        coordinates: {
            latitude: Number,
            longitude: Number,
        },
        lastUpdated: Date,
    },
    status: String, // 'available', 'busy', 'offline'
    rating: Number,
    bankInfo: {
        accountNumber: String,
        bankName: String,
        accountHolder: String,
    },
    image: { imageId: String, imageUrl: String },
    isEmailVerified: { type: Boolean, default: false },
    googleId: { type: String, trim: true },
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
riderSchema.pre('save', async function (next) {
    if (!this.isModified('password')) {
        return next();
    }
    const hash = await bcryptjs_1.default.genSalt(10);
    this.password = await bcryptjs_1.default.hash(this.password, hash);
    next();
});
riderSchema.methods.comparePassword = async function (password) {
    return await bcryptjs_1.default.compare(password, this.password);
};
riderSchema.methods.generateEmailVerificationOTP = async function () {
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
exports.default = (0, mongoose_1.model)('Rider', riderSchema);
//# sourceMappingURL=rider-model.js.map