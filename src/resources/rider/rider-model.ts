import { Schema, model } from 'mongoose';
import { IRider } from '../rider/rider-interface';
import bcrypt from 'bcryptjs';
import { config } from '../../config/index';
import { TokenService } from '../../utils/index';
import { generateOTP } from '../../utils/index';

const riderSchema = new Schema<IRider>(
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
            default: 'rider',
        },
        address: {
            street: { type: String, required: true },
            city: { type: String, required: true },
            state: { type: String, required: true },
        },
        phone: {
            type: String,
        },
        vehicleType: String,
        vehicleNumber: String,
        licenseImage: { imageId: String, imageUrl: String },
        currentLocation: {
            coordinates: {
                latitude: Number,
                longitude: Number,
            },
            lastUpdated: Date,
        },
        status: {
            type: String, // 'available', 'busy', 'offline'
            default: 'available',
        },
        rating: Number,
        bankInfo: {
            account_number: String,
            bank_code: String,
            account_name: String,
            recipientCode: String,
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

riderSchema.pre<IRider>('save', async function (next) {
    if (!this.isModified('password')) {
        return next();
    }

    const hash = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, hash);
    next();
});

riderSchema.methods.comparePassword = async function (
    password: string,
): Promise<boolean> {
    return await bcrypt.compare(password, this.password);
};

riderSchema.methods.generateEmailVerificationOTP = async function (): Promise<{
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

export default model<IRider>('Rider', riderSchema);
