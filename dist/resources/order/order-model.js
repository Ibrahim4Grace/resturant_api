"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const orderSchema = new mongoose_1.Schema({
    userId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    restaurantId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Restaurant',
        required: true,
    },
    items: [
        {
            menuId: {
                type: mongoose_1.Schema.Types.ObjectId,
                ref: 'Menu',
                required: true,
            },
            name: { type: String, required: true },
            quantity: { type: Number, required: true },
            price: { type: Number, required: true },
        },
    ],
    total_price: { type: Number, required: true },
    subtotal: {
        type: Number,
        required: true,
    },
    tax: {
        type: Number,
        required: true,
    },
    delivery_fee: {
        type: Number,
        required: true,
    },
    delivery_info: {
        address: String,
        riderId: {
            type: mongoose_1.Schema.Types.ObjectId,
            ref: 'Rider',
        },
        rider_name: String,
        estimatedDeliveryTime: Date,
    },
    order_number: { type: String, required: true },
    status: {
        type: String,
        enum: [
            'pending',
            'proccessing',
            'ready_for_pickup',
            'shipped',
            'delivered',
            'cancelled',
        ],
        default: 'pending',
    },
}, { timestamps: true });
exports.default = (0, mongoose_1.model)('Order', orderSchema);
//# sourceMappingURL=order-model.js.map