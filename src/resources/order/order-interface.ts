import { Types, Document } from 'mongoose';

export interface IOrder extends Document {
    orderId: string;
    status: OrderStatus;
    total_price: number;
    userId: Types.ObjectId;
    restaurantId: Types.ObjectId;
    items: OrderItem[];
    subtotal: number;
    tax: number;
    delivery_fee: number;
    delivery_info: DeliveryInfo;
    payment?: PaymentInfo;
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

export interface OrderItem {
    menuId: string;
    quantity: number;
    price: number;
    name: string;
}

export interface DeliveryInfo {
    address: string;
    riderId?: string;
    estimatedDeliveryTime?: Date;
}

export interface PaymentInfo {
    method: string; //  (e.g., "credit_card", "cash")
    status: string; //(e.g., "paid", "pending")
    transactionId?: string; // Optional transaction ID for the payment
}
