import UserModel from '@/resources/user/user-model';
import OrderModel from '@/resources/order/order-model';
import MenuModel from '@/resources/menu/menu-model';
import { generateOrderId } from '@/utils/index';
import {
    IOrder,
    OrderStatus,
    DeliveryInfo,
} from '@/resources/order/order-interface';
import { EmailQueueService, withCachedData, CACHE_TTL } from '@/utils/index';
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
    private menu = MenuModel;

    private sanitizeOrder(order: IOrder): Partial<IOrder> {
        return {
            orderId: order.orderId,
            status: order.status,
            total_price: order.total_price,
            userId: order.userId,
            restaurantId: order.restaurantId,
            items: order.items,
            subtotal: order.subtotal,
            tax: order.tax,
            delivery_fee: order.delivery_fee,
            delivery_info: order.delivery_info,
            payment: order.payment,
            createdAt: order.createdAt,
            updatedAt: order.updatedAt,
        };
    }

    public async placeOrder(
        userId: string,
        orderData: {
            items: { menuId: string; quantity: number }[];
            restaurantId: string;
            address: string;
        },
    ): Promise<Partial<IOrder>> {
        const user = await this.user.findById(userId);
        if (!user) {
            throw new ResourceNotFound('User not found');
        }
        const orderId = await generateOrderId();
        // Fetch prices for each menu item
        const itemsWithPrices = await Promise.all(
            orderData.items.map(async (item) => {
                const menuItem = await this.menu.findById(item.menuId);
                if (!menuItem) {
                    throw new ResourceNotFound(
                        `Menu item with ID ${item.menuId} not found`,
                    );
                }
                return {
                    ...item,
                    price: menuItem.price,
                    name: menuItem.name,
                };
            }),
        );

        // Calculate total
        const subtotal = itemsWithPrices.reduce(
            (acc, item) => acc + item.quantity * item.price,
            0,
        );

        //Both5%
        const taxRate = parseFloat(process.env.TAX_RATE);
        const delivery_fee = parseFloat(process.env.DELIVERY_FEE);
        const tax = subtotal * taxRate;
        const total_price = subtotal + tax + delivery_fee;

        // Round the values to 2 decimal places
        const roundedSubtotal = Math.round(subtotal * 100) / 100;
        const roundedTax = Math.round(tax * 100) / 100;
        const roundedTotalPrice = Math.round(total_price * 100) / 100;

        const delivery_info: DeliveryInfo = { address: orderData.address };

        const newOrder = await this.order.create({
            orderId,
            userId,
            delivery_info,
            restaurantId: orderData.restaurantId,
            items: itemsWithPrices,
            subtotal: roundedSubtotal,
            tax: roundedTax,
            delivery_fee,
            total_price: roundedTotalPrice,
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
