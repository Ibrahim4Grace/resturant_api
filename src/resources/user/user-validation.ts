import { z } from 'zod';

const regex =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{6,}$/;

const registerSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    email: z.string().email().trim().toLowerCase().min(1, 'Email is required'),
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
});

const forgetPwdSchema = z.object({
    email: z.string().email().trim().min(1, 'Email is required'),
});

const verifyOtpSchema = z.object({
    otp: z.string().min(1, 'Otp is required').max(6),
});

const resetPasswordSchema = z.object({
    newPassword: z
        .string()
        .regex(
            regex,
            'Password must include at least one uppercase letter, one lowercase letter, one number, and one special character',
        ),
});

const loginSchema = z.object({
    email: z.string().email().trim().min(1, 'Email is required'),
    password: z
        .string()
        .regex(
            regex,
            'Password must include at least one uppercase letter, one lowercase letter, one number, and one special character',
        ),
});

const imageSchema = z
    .object({
        imageId: z.string().optional(),
        imageUrl: z.string().url().optional(),
    })
    .optional();

const updateUserSchema = z
    .object({
        name: z.string().min(1).max(30).optional(),
        email: z.string().email().optional(),
        image: imageSchema,
        phone: z.string().optional(),
        addresses: z
            .object({
                street: z.string().min(1).max(100).optional(),
                city: z.string().min(1).max(50).optional(),
                state: z.string().min(1).max(50).optional(),
            })
            .optional(),
    })
    .passthrough(); // Allow additional fields

const addressesSchema = z.object({
    street: z.string().min(1, 'Street is required').max(100),
    city: z.string().min(1, 'City is required').max(50),
    state: z.string().min(1, 'State is required').max(50),
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
    registerSchema,
    forgetPwdSchema,
    verifyOtpSchema,
    resetPasswordSchema,
    loginSchema,
    updateUserSchema,
    addressesSchema,
    changePassword,
};
