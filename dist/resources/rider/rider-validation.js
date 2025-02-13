"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const zod_1 = require("zod");
const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{6,}$/;
const register = zod_1.z.object({
    name: zod_1.z.string().min(1, "Name is required").max(30),
    email: zod_1.z.string().email().trim().min(1, "Email is required"),
    street: zod_1.z.string().min(1, 'Street is required'),
    city: zod_1.z.string().min(1, 'City is required'),
    state: zod_1.z.string().min(1, 'State is required'),
    phone: zod_1.z.string().min(1, "Phone number is required"),
    password: zod_1.z
        .string()
        .regex(regex, "Password must include at least one uppercase letter, one lowercase letter, one number, and one special character"),
});
const forgetPwd = zod_1.z.object({
    email: zod_1.z.string().email().trim().min(1, "Email is required"),
});
const verifyOtp = zod_1.z.object({
    otp: zod_1.z.string().min(1, "Otp is required").max(6),
});
const resetPassword = zod_1.z.object({
    newPassword: zod_1.z
        .string()
        .regex(regex, "Password must include at least one uppercase letter, one lowercase letter, one number, and one special character"),
});
const login = zod_1.z.object({
    email: zod_1.z.string().email().trim().min(1, "Email is required"),
    password: zod_1.z
        .string()
        .regex(regex, "Password must include at least one uppercase letter, one lowercase letter, one number, and one special character"),
});
exports.default = {
    register,
    forgetPwd,
    verifyOtp,
    resetPassword,
    login,
};
//# sourceMappingURL=rider-validation.js.map