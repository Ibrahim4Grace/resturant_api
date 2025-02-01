import { EmailQueueService, withCachedData, CACHE_TTL } from '@/utils/index';
import UserModel from '@/resources/user/user-model';
import OrderModel from '@/resources/order/order-model';
import {
    IOrder,
    OrderStatus,
    OrderItem,
} from '@/resources/order/order-interface';
import {
    orderConfirmationEmail,
    orderStatusUpdateEmail,
    orderCancellationEmail,
    riderAssignedEmail,
} from '@/resources/order/order-email-template';
import {
    Conflict,
    ResourceNotFound,
    BadRequest,
    Forbidden,
    Unauthorized,
} from '@/middlewares/index';

export class OrderService {
    private order = OrderModel;
    private user = UserModel;

    private sanitizeOrder(order: IOrder): Partial<IOrder> {
        return {
            _id: order._id,
            status: order.status,
            totalPrice: order.totalPrice,
            userId: order.userId,
            restaurantId: order.restaurantId,
            items: order.items,
            subtotal: order.subtotal,
            tax: order.tax,
            deliveryFee: order.deliveryFee,
            total: order.total,
            deliveryInfo: order.deliveryInfo,
            payment: order.payment,
            createdAt: order.createdAt,
            updatedAt: order.updatedAt,
        };
    }

    public async placeOrder(
        userId: string,
        orderData: { items: OrderItem[]; restaurantId: string },
    ): Promise<any> {
        // Verify user exists
        const user = await this.user.findById(userId);
        if (!user) {
            throw new ResourceNotFound('User not found');
        }

        // Calculate total
        const subtotal = orderData.items.reduce(
            (acc, item) => acc + item.quantity * item.price,
            0,
        );
        const taxRate = parseFloat(process.env.TAX_RATE || '0.05'); // Default to 5% if not set
        const deliveryFee = parseFloat(process.env.DELIVERY_FEE || '5'); // Default to 5 if not set

        const tax = subtotal * taxRate;
        const total = subtotal + tax + deliveryFee;

        // Create new order
        const newOrder = await this.order.create({
            userId,
            restaurantId: orderData.restaurantId,
            items: orderData.items,
            subtotal,
            tax,
            deliveryFee,
            total,
            status: 'pending',
        });

        const emailOptions = orderConfirmationEmail(user, newOrder);
        await EmailQueueService.addEmailToQueue(emailOptions);

        return this.sanitizeOrder(newOrder);
    }

    public async getUserOrders(userId: string): Promise<Partial<IOrder>[]> {
        const cacheKey = `user_orders:${userId}`;
        return withCachedData<Partial<IOrder>[]>(
            cacheKey,
            async () => {
                const orders = await this.order
                    .find({ userId })
                    .sort({ createdAt: -1 })
                    .lean();
                return orders.map((order) => this.sanitizeOrder(order));
            },
            CACHE_TTL.FIVE_MINUTES,
        );
    }

    public async getOrderById(orderId: string): Promise<Partial<IOrder>> {
        const cacheKey = `order:${orderId}`;
        return withCachedData<Partial<IOrder>>(
            cacheKey,
            async () => {
                const order = await this.order.findById(orderId).lean();
                if (!order) {
                    throw new ResourceNotFound('Order not found');
                }
                return this.sanitizeOrder(order);
            },
            CACHE_TTL.FIVE_MINUTES,
        );
    }

    public async updateOrderStatus(
        orderId: string,
        status: OrderStatus,
    ): Promise<Partial<IOrder>> {
        const order = await this.order
            .findByIdAndUpdate(orderId, { status }, { new: true })
            .lean();
        if (!order) {
            throw new ResourceNotFound('Order not found');
        }

        const user = await this.user.findById(order.userId);
        if (user) {
            const emailOptions = orderStatusUpdateEmail(user, order);
            await EmailQueueService.addEmailToQueue(emailOptions);
        }
        return this.sanitizeOrder(order);
    }

    public async cancelOrder(orderId: string): Promise<Partial<IOrder>> {
        const order = await this.order.findById(orderId).lean();
        if (!order) {
            throw new ResourceNotFound('Order not found');
        }

        if (order.status !== 'pending' && order.status !== 'processing') {
            throw new BadRequest('Order cannot be cancelled');
        }

        const updatedOrder = await this.order
            .findByIdAndUpdate(orderId, { status: 'cancelled' }, { new: true })
            .lean();

        const user = await this.user.findById(order.userId);
        if (user) {
            const emailOptions = orderCancellationEmail(user, updatedOrder!);
            await EmailQueueService.addEmailToQueue(emailOptions);
        }

        return this.sanitizeOrder(updatedOrder!);
    }

    public async getOrdersByRestaurant(
        restaurantId: string,
    ): Promise<Partial<IOrder>[]> {
        const cacheKey = `restaurant_orders:${restaurantId}`;
        return withCachedData<Partial<IOrder>[]>(
            cacheKey,
            async () => {
                const orders = await this.order
                    .find({ restaurantId })
                    .sort({ createdAt: -1 })
                    .lean();
                return orders.map((order) => this.sanitizeOrder(order));
            },
            CACHE_TTL.FIVE_MINUTES,
        );
    }

    public async assignRiderToOrder(
        orderId: string,
        riderId: string,
    ): Promise<Partial<IOrder>> {
        const order = await this.order
            .findByIdAndUpdate(
                orderId,
                { 'deliveryInfo.riderId': riderId },
                { new: true },
            )
            .lean();
        if (!order) {
            throw new ResourceNotFound('Order not found');
        }

        const user = await this.user.findById(order.userId);
        if (user) {
            const emailOptions = riderAssignedEmail(user, order);
            await EmailQueueService.addEmailToQueue(emailOptions);
        }

        return this.sanitizeOrder(order);
    }
}
