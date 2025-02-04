import { Types, Document } from 'mongoose';

export interface IMenu extends Document {
    _id: Types.ObjectId;
    restaurantId: Types.ObjectId;
    name: string;
    description?: string;
    price: number;
    quantity: Number,
    category?: string;
    image: { imageId?: string; imageUrl?: string };
    availability: boolean;
    createdAt?: Date;
    updatedAt?: Date;
}

export interface MenuItem {
    _id: string;
    restaurantId: string;
    name: string;
    description?: string;
    price: number;
    quantity: Number,
    category?: string;
    image?: { imageId?: string; imageUrl?: string };
    createdAt?: Date;
    updatedAt?: Date;
}
