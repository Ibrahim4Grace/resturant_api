"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
exports.config = {
    PORT: process.env.PORT ?? 8000,
    NODE_ENV: process.env.NODE_ENV,
    DEV_URL: process.env.DEV_URL,
    PROD_URL: process.env.PROD_URL,
    CORS_WHITELIST: process.env.CORS_WHITELIST,
    JWT_AUTH_SECRET: process.env.JWT_AUTH_SECRET,
    JWT_AUTH_EXPIRY: process.env.JWT_AUTH_EXPIRY,
    JWT_EMAIL_SECRET: process.env.JWT_EMAIL_SECRET,
    EMAIL_TOKEN_EXPIRY: process.env.EMAIL_TOKEN_EXPIRY,
    OTP_EXPIRY: process.env.OTP_EXPIRY,
    MONGODB_URI: process.env.MONGODB_URI,
    REDIS_HOST: process.env.REDIS_HOST,
    REDIS_PORT: process.env.REDIS_PORT,
    REDIS_PASSWORD: process.env.REDIS_PASSWORD,
    REDIS_URL: process.env.REDIS_URL,
    RABBITMQ_URL: process.env.RABBITMQ_URL,
    TAX_RATE: process.env.TAX_RATE,
    DELIVERY_FEE: process.env.DELIVERY_FEE,
    MAILER_SERVICE: process.env.MAILER_SERVICE,
    NODEMAILER_EMAIL: process.env.NODEMAILER_EMAIL,
    NODEMAILER_PASSWORD: process.env.NODEMAILER_PASSWORD,
    CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
    CLOUDINARY_API_NAME: process.env.CLOUDINARY_API_NAME,
    CLOUDINARY_SECRET_NAME: process.env.CLOUDINARY_SECRET_NAME,
    PAYSTACK_SECRET_KEY: process.env.PAYSTACK_SECRET_KEY,
    PAYSTACK_URL: process.env.PAYSTACK_URL,
    PAYMENT_CALLBACK_URL: process.env.PAYMENT_CALLBACK_URL,
    SUPPORT_EMAIL: process.env.SUPPORT_EMAIL,
    SUPPORT_PHONE: process.env.SUPPORT_PHONE,
};
//# sourceMappingURL=env-config.js.map