import { Schema, model } from "mongoose";
import { IRider } from "@/resources/rider/rider-interface";
import bcrypt from "bcryptjs";
import { TokenService } from "@/utils/index";
import { generateOTP } from "@/utils/index";

const riderSchema = new Schema<IRider>(
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
        roles: {
            type: [String],
            default: ["rider"],
        },
        vehicleType: String,
        vehicleNumber: String,
        licenseNumber: String,
        documents: [
            {
                type: String, // 'license', 'insurance', 'identity'
                url: String,
                verificationStatus: String,
            },
        ],
        currentLocation: {
            coordinates: {
                latitude: Number,
                longitude: Number,
            },
            lastUpdated: Date,
        },
        status: String, // 'available', 'busy', 'offline'
        rating: Number,
        bankInfo: {
            accountNumber: String,
            bankName: String,
            accountHolder: String,
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

riderSchema.pre<IRider>("save", async function (next) {
    if (!this.isModified("password")) {
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
        expiresAt: new Date(Date.now() + Number(process.env.OTP_EXPIRY)),
        verificationToken,
    };

    return { otp, verificationToken };
};

export default model<IRider>("Rider", riderSchema);
