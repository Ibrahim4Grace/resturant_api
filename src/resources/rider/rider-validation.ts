import { z } from 'zod';

const regex =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{6,}$/;

const register = z.object({
    name: z.string().min(1, 'Name is required').max(30),
    email: z.string().email().trim().min(1, 'Email is required'),
    street: z.string().min(1, 'Street is required'),
    city: z.string().min(1, 'City is required'),
    state: z.string().min(1, 'State is required'),
    phone: z.string().min(1, 'Phone number is required'),
    password: z
        .string()
        .regex(
            regex,
            'Password must include at least one uppercase letter, one lowercase letter, one number, and one special character',
        ),
    licenseImage: z.any(),
});

const forgetPwd = z.object({
    email: z.string().email().trim().min(1, 'Email is required'),
});

const verifyOtp = z.object({
    otp: z.string().min(1, 'Otp is required').max(6),
});

const resetPassword = z.object({
    newPassword: z
        .string()
        .regex(
            regex,
            'Password must include at least one uppercase letter, one lowercase letter, one number, and one special character',
        ),
});

const login = z.object({
    email: z.string().email().trim().min(1, 'Email is required'),
    password: z
        .string()
        .regex(
            regex,
            'Password must include at least one uppercase letter, one lowercase letter, one number, and one special character',
        ),
});

const updateSchema = z.object({
    name: z.string().min(1, 'Name is required').max(30),
    email: z.string().email().trim().min(1, 'Email is required'),
    phone: z.string().min(1, 'Phone number is required'),
    address: z.object({
        street: z.string().min(1, 'Street is required'),
        city: z.string().min(1, 'City is required'),
        state: z.string().min(1, 'State is required'),
    }),
    bankInfo: z.object({
        accountNumber: z.string().min(1, 'Account number is required'),
        bankCode: z.string().min(1, 'Bank code is required'),
        accountHolder: z.string().min(1, 'Account name is required'),
    }),
});

const pickOrder = z.object({
    orderId: z.string().min(1, 'Order Idis required'),
});

const orderStatus = z.object({
    status: z.string().min(1, 'Status is required'),
});

const changePassword = z.object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z
        .string()
        .regex(
            regex,
            'Password must include at least one uppercase letter, one lowercase letter, one number, and one special character',
        ),
});

export default {
    register,
    forgetPwd,
    verifyOtp,
    resetPassword,
    login,
    updateSchema,
    pickOrder,
    orderStatus,
    changePassword,
};
