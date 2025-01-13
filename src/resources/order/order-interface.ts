import { Types, Document } from "mongoose";

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
    | "pending"
    | "confirmed"
    | "preparing"
    | "ready_for_pickup"
    | "in_delivery"
    | "delivered"
    | "cancelled";

export interface OrderItem {
    menuId: string; // Reference to the menu item
    quantity: number; // Quantity of the item
    price: number; // Price of the item
    customizations?: Customization[]; // Optional customizations
}

export interface Customization {
    name: string; // Customization group name (e.g., "Toppings")
    option: string; // Selected option (e.g., "Extra cheese")
    price: number; // Additional price for the customization
}

export interface DeliveryInfo {
    address: {
        address: string; // Delivery address
        coordinates: {
            latitude: number; // Latitude of the delivery address
            longitude: number; // Longitude of the delivery address
        };
    };
    riderId?: string; // Reference to the rider assigned for delivery
    estimatedDeliveryTime?: Date; // Estimated delivery time
}

export interface PaymentInfo {
    method: string; // Payment method (e.g., "credit_card", "cash")
    status: string; // Payment status (e.g., "paid", "pending")
    transactionId?: string; // Optional transaction ID for the payment
}
