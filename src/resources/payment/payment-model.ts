import { Schema, model } from 'mongoose';
import { IPayment } from '../payment/payment-interface';

const paymentSchema = new Schema<IPayment>(
    {
        orderId: {
            type: String,
            required: true,
            ref: 'Order',
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
            enum: ['paystack', 'cash_on_delivery'],
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
