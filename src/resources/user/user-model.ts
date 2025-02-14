import { Schema, model } from 'mongoose';
import { config } from '../../config/index';
import { IUser } from '../../resources/user/user-interface';
import bcrypt from 'bcryptjs';
import { generateOTP } from '../../utils/index';
import { TokenService } from '../../utils/index';

const userSchema = new Schema<IUser>(
    {
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
    },
    { timestamps: true },
);

//hashpassword
userSchema.pre<IUser>('save', async function (next) {
    if (!this.isModified('password')) {
        return next();
    }

    const hash = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, hash);
    next();
});

// Your password comparison logic
userSchema.methods.comparePassword = async function (
    password: string,
): Promise<boolean> {
    return await bcrypt.compare(password, this.password);
};

userSchema.methods.generateEmailVerificationOTP = async function (): Promise<{
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

export default model<IUser>('User', userSchema);
