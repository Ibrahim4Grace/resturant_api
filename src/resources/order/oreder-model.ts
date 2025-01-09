import { Schema, model } from "mongoose";
import IOrder from "@/resources/order/order-interface";

const orderSchema = new Schema<IOrder>(
    {
        status: {
            type: String,
            required: true,
        },
        totalPrice: {
            type: Number,
            required: true,
        },
        items: [
            {
                type: String,
                required: true,
                trim: true,
            },
        ],
        userId: [
            {
                type: Schema.Types.ObjectId,
                ref: "User",
            },
        ],
        restaurantId: [
            {
                type: Schema.Types.ObjectId,
                ref: "Restaurant",
            },
        ],
        riderId: [
            {
                type: Schema.Types.ObjectId,
                ref: "Rider",
            },
        ],
    },
    { timestamps: true },
);

export default model<IOrder>("Order", orderSchema);
