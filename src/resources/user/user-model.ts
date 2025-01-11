import { Schema, model } from "mongoose";
import { IUser } from "@/resources/user/user-interface";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { UserRole } from "@/enums/userRoles";
import { generateOTP } from "@/utils/index";

const userSchema = new Schema<IUser>(
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
            enum: Object.values(UserRole),
            default: UserRole.USER,
            trim: true,
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

//hashpassword
userSchema.pre<IUser>("save", async function (next) {
    if (!this.isModified("password")) {
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

    const verificationToken = jwt.sign(
        { userId: this._id },
        process.env.JWT_SECRET!,
        {
            expiresIn: process.env.OTP_EXPIRY,
        },
    );

    this.emailVerificationOTP = {
        otp: hashedOTP,
        expiresAt: new Date(Date.now() + Number(process.env.OTP_EXPIRY)),
        verificationToken,
    };

    return { otp, verificationToken };
};

export default model<IUser>("User", userSchema);
