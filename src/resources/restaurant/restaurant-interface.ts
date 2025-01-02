import { Document } from "mongoose";

export default interface Restaurant extends Document {
    name: string;
    location: string;
    menu: string;
    workingHours: string;
    createdAt: Date;
    updatedAt: Date;

    // Improved typing for toJSON
    toJSON(): {
        _id: string;
        location: string;
        menu: string;
        workingHours: string;
        createdAt: Date;
        updatedAt: Date;
    };
}
