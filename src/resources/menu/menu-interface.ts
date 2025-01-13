import { Types, Document } from "mongoose";

export interface Menu extends Document {
    restaurantId: Types.ObjectId;
    name: string;
    description?: string;
    price: number;
    category?: string;
    image: { imageId?: string; imageUrl?: string };
    customizations?: Customization[];
    availability: boolean;
    createdAt?: Date;
    updatedAt?: Date;
}

export interface Customization {
    name: string; // Customization group name (e.g., "Add-ons")
    options: CustomizationOption[]; // List of available options
    required: boolean; // Whether the customization is required
}

export interface CustomizationOption {
    name: string; // Option name (e.g., "Extra cheese")
    price: number; // Additional price for the option
}
