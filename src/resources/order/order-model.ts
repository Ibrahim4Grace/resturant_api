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

// Add indexes for frequently queried fields
orderSchema.index({ userId: 1 });
orderSchema.index({ restaurantId: 1 });
orderSchema.index({ order_number: 1 }, { unique: true });
orderSchema.index({ status: 1 });
orderSchema.index({ 'delivery_info.riderId': 1 });
orderSchema.index({ delivery_confirmed: 1 });

export default model<IOrder>('Order', orderSchema);
