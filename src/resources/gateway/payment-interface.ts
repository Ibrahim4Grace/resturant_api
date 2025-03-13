import { Types } from 'mongoose';

export interface IPayment {
    _id?: string;
    userId: Types.ObjectId;
    orderId: Types.ObjectId;
    amount: number;
    status: 'processing' | 'completed' | 'failed';
    paymentMethod: 'transfer' | 'cash_on_delivery';
    transactionDetails?: {
        reference: string;
        authorizationUrl?: string;
    };
    createdAt?: Date;
    updatedAt?: Date;
}

export type OrderStatus =
    | 'pending'
    | 'processing'
    | 'ready_for_pickup'
    | 'shipped'
    | 'delivered'
    | 'cancelled';

export interface PaystackResponse {
    status: boolean;
    message: string;
    data: {
        authorization_url: string;
        access_code: string;
        reference: string;
    };
}

export interface PaymentResponse {
    success: boolean;
    message: string;
    data?: {
        authorization_url?: string;
        reference?: string;
    };
}

export interface paymentProcess {
    userId: string;
    orderId: string;
    paymentMethod: string;
    userEmail: string;
}
