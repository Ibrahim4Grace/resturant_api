import { Schema, model } from 'mongoose';
import { IOrder } from '../order/order-interface';

const orderSchema = new Schema<IOrder>(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        restaurantId: {
            type: Schema.Types.ObjectId,
            ref: 'Restaurant',
            required: true,
        },
        items: [
            {
                menuId: {
                    type: Schema.Types.ObjectId,
                    ref: 'Menu',
                    required: true,
                },
                name: { type: String, required: true },
                quantity: { type: Number, required: true },
                price: { type: Number, required: true },
            },
        ],
        total_price: { type: Number, required: true },
        payment_method: {
            type: String,
            enum: ['transfer', 'cash_on_delivery'],
            required: true,
        },
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
            delivery_address: String,
            riderId: {
                type: Schema.Types.ObjectId,
                ref: 'Rider',
            },
            rider_name: String,
            estimatedDeliveryTime: Date,
            customerConfirmationTime: Date,
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
        delivery_confirmed: {
            type: Boolean,
            default: false,
        },
        has_dispute: {
            type: Boolean,
            default: false,
        },
        dispute_details: {
            issue_type: String,
            description: String,
            reported_at: Date,
            status: {
                type: String,
                enum: ['pending', 'investigating', 'resolved', 'rejected'],
                default: 'pending',
            },
            resolution: String,
            resolved_at: Date,
        },
    },
    { timestamps: true },
);

export default model<IOrder>('Order', orderSchema);
