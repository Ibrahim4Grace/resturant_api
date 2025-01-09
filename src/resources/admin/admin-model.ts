import { Schema, model } from "mongoose";
import { IAdmin } from "@/resources/admin/admin-interface";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import otpGenerator from "otp-generator";


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
            trim: true,
            enum: ["restaurant-owner", "Admin"],
            default: "Admin",
        },
        image: { imageId: String, imageUrl: String },
        isEmailVerified: { type: Boolean, default: false },
        googleId: { type: String, trim: true },
    },
    { timestamps: true },
);

//hashpassword
adminSchema.pre<IAdmin>("save", async function (next) {
    if (!this.isModified("password")) {
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

adminSchema.methods.generateOTP = async function (): Promise<string> {
    const otp = otpGenerator.generate(6, {
        lowerCaseAlphabets: false,
        upperCaseAlphabets: false,
        specialChars: false,
    });

    const hashedOTP = await bcrypt.hash(otp, 10);
    const verificationToken = jwt.sign(
        { userId: this._id.toString() },
        process.env.JWT_SECRET!,
        {
            expiresIn: process.env.OTP_EXPIRY,
            audience: "email-verification",
        },
    );

    this.otpData = {
        code: hashedOTP,
        expiresAt: new Date(Date.now() + Number(process.env.OTP_EXPIRY)),
        verificationToken,
    };

    return otp;
};

adminSchema.methods.generatePasswordResetToken = function (): string {
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
export default model<IAdmin>("Admin", adminSchema);
