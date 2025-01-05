import { Document } from "mongoose";

export interface Admin extends Document {
    _id: string;
    name: string;
    email: string;
    password: string;
    role: string;
    image: String;
    isEmailVerified: boolean;
    googleId: string;
    createdAt: Date;
    updatedAt: Date;

    // Changed to async for password comparison
    comparePassword(password: string): Promise<boolean>;

    // Added return type for token
    generateToken(): string;
}
