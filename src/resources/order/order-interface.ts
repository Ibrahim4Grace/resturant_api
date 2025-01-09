import { Document } from "mongoose";

export default interface IOrder extends Document {
    status: string;
    totalPrice: number;
    items: string;
    userId: string;
    restaurantId: string;
    riderId: string;
    createdAt: Date;
    updatedAt: Date;
}
