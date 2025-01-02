import { Schema, model } from "mongoose";
import User from "@/resources/user/user-interface";
import { ContactFormType } from "@/utils/types/index";
import bcrypt from "bcrypt";

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

// userSchema.methods.generateToken = function (): string {
//     // Your token generation logic
//     return jwt.sign({ id: this._id }, process.env.JWT_SECRET!);
// };

export default model<User>("User", userSchema);

const contactSchema = new Schema(
    {
        first_name: {
            type: String,
            required: true,
        },
        last_name: {
            type: String,
            required: true,
        },
        number: {
            type: String,
            required: true,
        },
        email: {
            type: String,
            required: true,
            unique: true,
            trim: true,
        },
        subject: {
            type: String,
            required: true,
        },
        message: {
            type: String,
            required: true,
        },
    },
    { timestamps: true },
);

export const ContactUsModel = model<ContactFormType>(
    "ContactUs",
    contactSchema,
);
