import { Types, Document } from 'mongoose';

export interface IMenu extends Document {
    _id: Types.ObjectId;
    restaurantId: Types.ObjectId;
    name: string;
    description?: string;
    price: number;
    category?: string;
    image: { imageId?: string; imageUrl?: string };
    availability: boolean;
    createdAt?: Date;
    updatedAt?: Date;
}

export interface MenuItemData {
    name: string;
    description?: string;
    price: number;
    category?: string;
    image?: { imageId: string; imageUrl: string };
}

// Define MenuItem as a plain object
export interface MenuItem {
    _id: string;
    restaurantId: string;
    name: string;
    description?: string;
    price: number;
    category?: string;
    image?: { imageId?: string; imageUrl?: string };
    createdAt?: Date;
    updatedAt?: Date;
}
