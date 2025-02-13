import { Types, Document } from 'mongoose';

export interface IOrder extends Document {
    orderId: Types.ObjectId;
    order_number: string;
    status: OrderStatus;
    total_price: number;
    userId: Types.ObjectId;
    restaurantId: Types.ObjectId;
    items: OrderItem[];
    subtotal: number;
    tax: number;
    delivery_fee: number;
    delivery_info: DeliveryInfo;
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
    rider_name?: string;
    estimatedDeliveryTime?: Date;
}

export interface BaseOrderParams {
    orderId: string;
    restaurantId?: string;
}

export interface UpdateOrderStatusParams extends BaseOrderParams {
    status?: string;
    rider_name?: string;
}
