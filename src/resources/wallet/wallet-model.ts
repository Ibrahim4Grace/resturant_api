import { Schema, model } from 'mongoose';
import { IWallet } from './wallet-interface';

const WalletSchema = new Schema<IWallet>(
    {
        userId: {
            type: Schema.Types.ObjectId,
            required: true,
            refPath: 'userType',
        },
        userType: {
            type: String,
            required: true,
            enum: ['restaurant', 'rider'],
        },
        balance: {
            type: Number,
            default: 0,
        },
        transactions: [
            {
                amount: {
                    type: Number,
                    required: true,
                },
                type: {
                    type: String,
                    enum: ['credit', 'debit'],
                    required: true,
                },
                description: {
                    type: String,
                    required: true,
                },
                reference: {
                    type: String,
                    required: true,
                },
                status: {
                    type: String,
                    enum: ['pending', 'completed', 'failed'],
                    default: 'pending',
                },
                createdAt: {
                    type: Date,
                    default: Date.now,
                },
            },
        ],
    },
    { timestamps: true },
);

export default model<IWallet>('Wallet', WalletSchema);
