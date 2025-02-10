import { Schema, model } from 'mongoose';
import { IPayment } from '@/resources/payment/payment-interface';

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
            enum: ['pending', 'processing', 'completed', 'failed'],
            default: 'pending',
        },
        reference: {
            type: String,
            sparse: true,
            unique: true,
        },
        method: {
            type: String,
            enum: ['paystack', 'cash'],
            required: true,
        },
        transactionDetails: {
            provider: String,
            reference: String,
            authorizationUrl: String,
            metadata: Schema.Types.Mixed,
        },
    },
    { timestamps: true },
);

export default model<IPayment>('Payment', paymentSchema);
