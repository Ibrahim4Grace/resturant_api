import { Document } from "mongoose";

export default interface IRestaurant extends Document {
    name: string;
    location: string;
    menu: string;
    role: string;
    email: string;
    workingHours: string;
    createdAt: Date;
    updatedAt: Date;
}
