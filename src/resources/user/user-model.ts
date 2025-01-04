import { Schema, model } from "mongoose";
import { User, OTPData } from "@/resources/user/user-interface";
import jwt from "jsonwebtoken";
import otpGenerator from "otp-generator";
import bcrypt from "bcrypt";

// const OTP_EXPIRY = 20 * 60 * 1000;

const userSchema = new Schema<User>(
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
            trim: true,
            default: "User",
        },
        image: { imageId: String, imageUrl: String },
        isEmailVerified: { type: Boolean, default: false },
        googleId: { type: String, trim: true },
        passwordResetToken: String,
        passwordResetExpires: Date,
        otpData: {
            code: String,
            expiresAt: Date,
        },
    },
    { timestamps: true },
);

//hashpassword
userSchema.pre<User>("save", async function (next) {
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

userSchema.methods.generateOTP = async function (): Promise<string> {
    const otp = otpGenerator.generate(6, {
        lowerCaseAlphabets: false,
        upperCaseAlphabets: false,
        specialChars: false,
    });

    const hashedOTP = await bcrypt.hash(otp, 10);

    this.otpData = {
        code: hashedOTP,
        expiresAt: new Date(Date.now() + Number(process.env.OTP_EXPIRY)),
    };

    return otp;
};

userSchema.methods.generatePasswordResetToken = function (): string {
    const resetToken = jwt.sign({ userId: this._id }, process.env.JWT_SECRET!, {
        expiresIn: process.env.PASSWORD_RESET_TOKEN_EXPIRY,
        audience: "password-reset",
    });

    this.passwordResetToken = resetToken;
    this.passwordResetExpires = new Date(
        Date.now() + Number(process.env.OTP_EXPIRY),
    );

    return resetToken;
};

export default model<User>("User", userSchema);
