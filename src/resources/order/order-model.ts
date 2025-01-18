import { Schema, model } from "mongoose";
import { IOrder } from "@/resources/order/order-interface";

const orderSchema = new Schema<IOrder>(
    {
        status: {
            type: String,
            required: true,
            enum: [
                "pending",
                "confirmed",
                "preparing",
                "ready_for_pickup",
                "in_delivery",
                "delivered",
                "cancelled",
            ],
        },
        totalPrice: {
            type: Number,
            required: true,
        },
        userId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        restaurantId: {
            type: Schema.Types.ObjectId,
            ref: "Restaurant",
            required: true,
        },
        items: [
            {
                menuId: {
                    type: Schema.Types.ObjectId,
                    ref: "Menu",
                    required: true,
                },
                quantity: {
                    type: Number,
                    required: true,
                },
                price: {
                    type: Number,
                    required: true,
                },
                customizations: [
                    {
                        name: String,
                        option: String,
                        price: Number,
                    },
                ],
            },
        ],
        subtotal: {
            type: Number,
            required: true,
        },
        tax: {
            type: Number,
            required: true,
        },
        deliveryFee: {
            type: Number,
            required: true,
        },
        total: {
            type: Number,
            required: true,
        },
        deliveryInfo: {
            address: {
                address: String,
                coordinates: {
                    latitude: Number,
                    longitude: Number,
                },
            },
            riderId: {
                type: Schema.Types.ObjectId,
                ref: "Rider",
            },
            estimatedDeliveryTime: Date,
        },
        payment: {
            method: String,
            status: String,
            transactionId: String,
        },
    },
    { timestamps: true },
);

export default model<IOrder>("Order", orderSchema);
