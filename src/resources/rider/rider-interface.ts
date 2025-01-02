import { Document } from "mongoose";

export default interface Order extends Document {
    name: string;
    phone: string;
    availability: string;
    currentOrder: string;
    createdAt: Date;
    updatedAt: Date;

    // Improved typing for toJSON
    toJSON(): {
        _id: string;
        name: string;
        phone: string;
        availability: string;
        currentOrder: string;
        createdAt: Date;
        updatedAt: Date;
    };
}
