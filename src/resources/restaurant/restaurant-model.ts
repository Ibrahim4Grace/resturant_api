import { Schema, model } from 'mongoose';
import { config } from '../../config/index';
import { IRestaurant } from '../restaurant/restaurant-interface';
import { TokenService, generateOTP } from '../../utils/index';
import bcrypt from 'bcryptjs';

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
        status: {
            type: String,
            default: 'pending', // 'active', 'pending', 'suspended'
        },
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
        reviewStats: {
            totalReviews: { type: Number, default: 0 },
            averageRating: { type: Number, default: 0 },
        },
    },
    { timestamps: true },
);

// update review statistics
restaurantSchema.methods.updateReviewStats = async function () {
    if (this.reviews && this.reviews.length > 0) {
        const totalReviews = this.reviews.length;
        const averageRating =
            this.reviews.reduce((acc, review) => acc + review.rating, 0) /
            totalReviews;

        this.reviewStats = {
            totalReviews,
            averageRating: parseFloat(averageRating.toFixed(1)),
        };
        this.rating = this.reviewStats.averageRating;
    }
};

//update stats when reviews are modified
restaurantSchema.pre('save', async function (next) {
    if (this.isModified('reviews')) {
        await this.updateReviewStats();
    }
    next();
});

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
