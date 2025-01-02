import { Document } from "mongoose";

export default interface Order extends Document {
    status: string;
    totalPrice: number;
    items: string;
    userId: string;
    restaurantId: string;
    riderId: string;
    createdAt: Date;
    updatedAt: Date;

    // Improved typing for toJSON
    toJSON(): {
        _id: string;
        status: string;
        totalPrice: number;
        items: string;
        userId: string;
        restaurantId: string;
        riderId: string;
        createdAt: Date;
        updatedAt: Date;
    };
}
