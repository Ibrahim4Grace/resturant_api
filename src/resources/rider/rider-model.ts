import { Schema, model } from "mongoose";
import Rider from "@/resources/rider/rider-interface";

const riderSchema = new Schema<Rider>(
    {
        name: {
            type: String,
            required: true,
        },
        phone: {
            type: String,
            required: true,
        },
        availability: {
            type: String,
            required: true,
            trim: true,
        },

        currentOrder: {
            type: String,
            required: true,
            trim: true,
        },
    },
    { timestamps: true },
);

export default model<Rider>("Rider", riderSchema);
