import { Types, Document } from 'mongoose';

export interface IOrder extends Document {
    orderId?: Types.ObjectId;
    order_number: string;
    status: OrderStatus;
    total_price: number;
    userId: Types.ObjectId;
    restaurantId: Types.ObjectId;
    items: OrderItem[];
    subtotal: number;
    payment_method: 'transfer' | 'cash_on_delivery';
    tax: number;
    delivery_fee: number;
    delivery_info: DeliveryInfo;
    delivery_confirmed: boolean;
    has_dispute: boolean;
    dispute_details: DisputeDetails;
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
export interface DisputeDetails {
    issue_type: String;
    description: String;
    reported_at: Date;
    status: String;
    resolution: String;
    resolved_at: Date;
}

export interface DeliveryInfo {
    delivery_address: string;
    riderId?: string;
    rider_name?: string;
    estimatedDeliveryTime?: Date;
    customerConfirmationTime?: Date;
}

export interface BaseOrderParams {
    orderId: string;
    restaurantId?: string;
}

export interface UpdateOrderStatusParams extends BaseOrderParams {
    status?: string;
    riderId?: string;
}
