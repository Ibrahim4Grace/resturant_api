import { Schema, model } from "mongoose";
import Admin from "@/resources/admin/admin-interface";
import bcrypt from "bcrypt";

const adminSchema = new Schema<Admin>(
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
adminSchema.pre<Admin>("save", async function (next) {
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

// adminSchema.methods.generateToken = function (): string {
//     // Your token generation logic
//     return jwt.sign({ id: this._id }, process.env.JWT_SECRET!);
// };

export default model<Admin>("Admin", adminSchema);
