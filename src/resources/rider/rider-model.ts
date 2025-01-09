import { Schema, model } from "mongoose";
import IRider from "@/resources/rider/rider-interface";

const riderSchema = new Schema<IRider>(
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

export default model<IRider>("Rider", riderSchema);
