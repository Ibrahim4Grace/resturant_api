import { Types } from 'mongoose';

export interface IPayment {
    _id?: string;
    userId: Types.ObjectId;
    orderId: string;
    amount: number;
    reference?: string;
    status: 'pending' | 'completed' | 'failed';
    method: PaymentMethod;
    transactionDetails?: {
        provider: string;
        reference: string;
        authorizationUrl?: string;
    };
    createdAt?: Date;
    updatedAt?: Date;
}

export type PaymentMethod = 'paystack' | 'cash';
export type PaymentStatus = 'pending' | 'processing' | 'completed' | 'failed';
export type OrderStatus =
    | 'pending'
    | 'processing'
    | 'ready_for_pickup'
    | 'shipped'
    | 'delivered'
    | 'cancelled';

export interface PaymentInitiateDTO {
    orderId: string;
    userId: string;
    amount: number;
    method: PaymentMethod;
    email?: string;
}

export interface PaymentResponse {
    id: string;
    status: PaymentStatus;
    method: PaymentMethod;
    amount: number;
    authorizationUrl?: string;
    reference?: string;
}

export interface PaymentInitialization {
    authorizationUrl: string;
    reference: string;
}
