import { Document } from "mongoose";

export default interface IRider extends Document {
    id: string;
    name: string;
    email: string;
    password: string;
    role: string;
    phone: string;
    availability: string;
    currentOrder: string;
    image: { imageId?: string; imageUrl?: string };
    isEmailVerified: boolean;
    googleId?: string;
    createdAt: Date;
    updatedAt: Date;
}
