import { Schema, model } from 'mongoose';
import { IAdmin } from '@/resources/admin/admin-interface';
import { TokenService } from '@/utils/index';
import { config } from '@/config/index';
import bcrypt from 'bcryptjs';
import { generateOTP } from '@/utils/index';

const adminSchema = new Schema<IAdmin>(
    {
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
        role: {
            type: String,
            default: 'admin',
        },
        phone: {
            type: String,
        },
        address: {
            street: String,
            city: String,
            state: String,
        },
        image: { imageId: String, imageUrl: String },
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
    },
    { timestamps: true },
);

//hashpassword
adminSchema.pre<IAdmin>('save', async function (next) {
    if (!this.isModified('password')) {
        return next();
    }

    const hash = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, hash);
    next();
});

// Your password comparison logic
adminSchema.methods.comparePassword = async function (
    password: string,
): Promise<boolean> {
    return await bcrypt.compare(password, this.password);
};

adminSchema.methods.generateEmailVerificationOTP = async function (): Promise<{
    otp: string;
    verificationToken: string;
}> {
    const { otp, hashedOTP } = await generateOTP();

    const verificationToken = TokenService.createEmailVerificationToken({
        userId: this._id,
        email: this.email,
    });

    this.emailVerificationOTP = {
        otp: hashedOTP,
        expiresAt: new Date(Date.now() + Number(config.OTP_EXPIRY)),
        verificationToken,
    };

    return { otp, verificationToken };
};

export default model<IAdmin>('Admin', adminSchema);
