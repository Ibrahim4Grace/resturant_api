import { Schema, model } from 'mongoose';
import { config } from '@/config/index';
import { IRestaurant } from '@/resources/restaurant/interface';
import { TokenService } from '@/utils/index';
import bcrypt from 'bcryptjs';
import { generateOTP } from '@/utils/index';

const restaurantSchema = new Schema<IRestaurant>(
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
        ownerId: { type: Schema.Types.ObjectId, ref: 'User' },
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
    },
    { timestamps: true },
);

restaurantSchema.pre<IRestaurant>('save', async function (next) {
    if (!this.isModified('password')) {
        return next();
    }

    const hash = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, hash);
    next();
});

restaurantSchema.methods.comparePassword = async function (
    password: string,
): Promise<boolean> {
    return await bcrypt.compare(password, this.password);
};

restaurantSchema.methods.generateEmailVerificationOTP =
    async function (): Promise<{
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

export default model<IRestaurant>('Restaurant', restaurantSchema);
