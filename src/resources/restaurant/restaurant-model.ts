import { Schema, model } from "mongoose";
import Restaurant from "@/resources/restaurant/restaurant-interface";

const restaurantSchema = new Schema<Restaurant>(
    {
        name: {
            type: String,
            required: true,
        },
        location: {
            type: String,
            required: true,
            unique: true,
            trim: true,
        },
        menu: [
            {
                type: Schema.Types.ObjectId,
                ref: "Menu",
            },
        ],
        workingHours: {
            type: String,
            trim: true,
        },
    },
    { timestamps: true },
);

export default model<Restaurant>("Restaurant", restaurantSchema);
