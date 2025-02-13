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
    images: zod_1.z.any(),
});
const createSchema = zod_1.z.object({
    name: zod_1.z.string().min(1, 'Name is required').max(30),
    street: zod_1.z.string().min(1, 'Street is required'),
    city: zod_1.z.string().min(1, 'City is required'),
    state: zod_1.z.string().min(1, 'State is required'),
    phone: zod_1.z.string().min(1, 'Phone number is required'),
    password: zod_1.z
        .string()
        .regex(regex, 'Password must include at least one uppercase letter, one lowercase letter, one number, and one special character'),
    images: zod_1.z.any(),
});
// Create update schema with additional fields specific to restaurant updates and omit password
const updateSchema = createSchema
    .omit({ password: true })
    .extend({
    cuisine: zod_1.z.array(zod_1.z.string()),
    operatingHours: zod_1.z.array(zod_1.z.object({
        day: zod_1.z.string(),
        open: zod_1.z.string(),
        close: zod_1.z.string(),
    })),
})
    .partial();
// const updateSchema = createSchema.omit({ password: true }).partial();
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
exports.default = {
    registerSchema,
    forgetPwdSchema,
    verifyOtpSchema,
    resetPasswordSchema,
    loginSchema,
    createSchema,
    updateSchema,
};
//# sourceMappingURL=validation.js.map