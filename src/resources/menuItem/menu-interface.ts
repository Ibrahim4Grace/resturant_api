import { Document } from "mongoose";

export default interface Menu extends Document {
    name: string;
    description: string;
    price: number;
    availability: string;
    createdAt: Date;
    updatedAt: Date;

    // Improved typing for toJSON
    toJSON(): {
        _id: string;
        name: string;
        description: string;
        price: number;
        availability: string;
        createdAt: Date;
        updatedAt: Date;
    };
}
