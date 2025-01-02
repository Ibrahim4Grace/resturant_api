import { Schema, model } from "mongoose";
import Menu from "@/resources/menuItem/menu-interface";

const menuSchema = new Schema<Menu>(
    {
        name: {
            type: String,
            required: true,
        },
        description: {
            type: String,
            required: true,
            trim: true,
        },
        price: { type: Number, required: true },
        availability: {
            type: String,
            trim: true,
        },
    },
    { timestamps: true },
);

export default model<Menu>("Menu", menuSchema);
