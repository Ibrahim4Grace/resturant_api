import { Schema, model } from 'mongoose';
import { IOrder } from '../../resources/order/order-interface';

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
    },
    { timestamps: true },
);

export default model<IOrder>('Order', orderSchema);
