"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const zod_1 = require("zod");
const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{6,}$/;
const registerSchema = zod_1.z.object({
    name: zod_1.z.string().min(1, 'Name is required').max(30),
    email: zod_1.z.string().email().trim().min(1, 'Email is required'),
    street: zod_1.z.string().min(1, 'Street is required'),
    city: zod_1.z.string().min(1, 'City is required'),
    state: zod_1.z.string().min(1, 'State is required'),
    phone: zod_1.z.string().min(1, 'Phone number is required'),
    password: zod_1.z
        .string()
        .regex(regex, 'Password must include at least one uppercase letter, one lowercase letter, one number, and one special character'),
});
const forgetPwdSchema = zod_1.z.object({
    email: zod_1.z.string().email().trim().min(1, 'Email is required'),
});
const verifyOtpSchema = zod_1.z.object({
    otp: zod_1.z.string().min(1, 'Otp is required').max(6),
});
const resetPasswordSchema = zod_1.z.object({
    newPassword: zod_1.z
        .string()
        .regex(regex, 'Password must include at least one uppercase letter, one lowercase letter, one number, and one special character'),
});
const loginSchema = zod_1.z.object({
    email: zod_1.z.string().email().trim().min(1, 'Email is required'),
    password: zod_1.z
        .string()
        .regex(regex, 'Password must include at least one uppercase letter, one lowercase letter, one number, and one special character'),
});
const paymentMethodSchema = zod_1.z
    .object({
    type: zod_1.z.string().optional(),
    last4: zod_1.z.string().length(4).optional(),
    expiryDate: zod_1.z.date().optional(),
    isDefault: zod_1.z.boolean().optional(),
})
    .optional();
const imageSchema = zod_1.z
    .object({
    imageId: zod_1.z.string().optional(),
    imageUrl: zod_1.z.string().url().optional(),
})
    .optional();
const updateUserSchema = zod_1.z
    .object({
    name: zod_1.z.string().min(1).max(30).optional(),
    email: zod_1.z.string().email().optional(),
    paymentMethods: zod_1.z.array(paymentMethodSchema).optional(),
    image: imageSchema,
    phone: zod_1.z.string().optional(),
    addresses: zod_1.z
        .object({
        street: zod_1.z.string().min(1).max(100).optional(),
        city: zod_1.z.string().min(1).max(50).optional(),
        state: zod_1.z.string().min(1).max(50).optional(),
    })
        .optional(),
})
    .passthrough(); // Allow additional fields
const addressesSchema = zod_1.z.object({
    street: zod_1.z.string().min(1, 'Street is required').max(100),
    city: zod_1.z.string().min(1, 'City is required').max(50),
    state: zod_1.z.string().min(1, 'State is required').max(50),
});
exports.default = {
    registerSchema,
    forgetPwdSchema,
    verifyOtpSchema,
    resetPasswordSchema,
    loginSchema,
    updateUserSchema,
    addressesSchema,
};
//# sourceMappingURL=user-validation.js.map