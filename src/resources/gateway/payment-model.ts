import { Schema, model } from 'mongoose';
import { IPayment } from '../gateway/payment-interface';

const paymentSchema = new Schema<IPayment>(
    {
        orderId: {
            type: Schema.Types.ObjectId,
            ref: 'Order',
            required: true,
        },
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        amount: {
            type: Number,
            required: true,
        },
        status: {
            type: String,
            enum: ['processing', 'completed', 'failed'],
            default: 'processing',
        },
        paymentMethod: {
            type: String,
            enum: ['transfer', 'cash_on_delivery'],
            required: true,
        },
        transactionDetails: {
            reference: String,
            authorizationUrl: String,
            metadata: Schema.Types.Mixed,
        },
    },
    { timestamps: true },
);

export default model<IPayment>('Payment', paymentSchema);
