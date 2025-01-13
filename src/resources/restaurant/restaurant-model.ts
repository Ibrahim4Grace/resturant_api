import { Schema, model } from "mongoose";
import { IRestaurant } from "@/resources/restaurant/restaurant-interface";
import { TokenService } from "@/utils/index";
import bcrypt from "bcryptjs";
import { generateOTP } from "@/utils/index";

const restaurantSchema = new Schema<IRestaurant>(
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
        businessLicense: String,
        address: {
            street: String,
            city: String,
            state: String,
            coordinates: {
                latitude: Number,
                longitude: Number,
            },
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
        status: String, // 'active', 'inactive', 'suspended'
        bankInfo: {
            accountNumber: String,
            bankName: String,
            accountHolder: String,
        },
        password: {
            type: String,
            required: true,
        },
        roles: {
            type: [String],
            default: ["restaurant_owner"],
        },
        image: { imageId: String, imageUrl: String },
        isEmailVerified: { type: Boolean, default: false },
        googleId: { type: String, trim: true },
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

restaurantSchema.pre<IRestaurant>("save", async function (next) {
    if (!this.isModified("password")) {
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
            expiresAt: new Date(Date.now() + Number(process.env.OTP_EXPIRY)),
            verificationToken,
        };

        return { otp, verificationToken };
    };

export default model<IRestaurant>("Restaurant", restaurantSchema);
