import { Types, Document } from 'mongoose';

export interface IOrder extends Document {
    status: OrderStatus;
    totalPrice: number;
    userId: Types.ObjectId;
    restaurantId: Types.ObjectId;
    items: OrderItem[];
    subtotal: number;
    tax: number;
    deliveryFee: number;
    total: number; // Final total price (subtotal + tax + delivery fee)
    deliveryInfo?: DeliveryInfo;
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
    menuId: string; // Reference to the menu item
    quantity: number; // Quantity of the item
    price: number; // Price of the item
}

export interface DeliveryInfo {
    address: string; // Delivery address
    riderId?: string; // Reference to the rider assigned for delivery
    estimatedDeliveryTime?: Date; // Estimated delivery time
}

export interface PaymentInfo {
    method: string; // Payment method (e.g., "credit_card", "cash")
    status: string; // Payment status (e.g., "paid", "pending")
    transactionId?: string; // Optional transaction ID for the payment
}
