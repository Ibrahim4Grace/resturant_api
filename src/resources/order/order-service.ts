import UserModel from '@/resources/user/user-model';
import OrderModel from '@/resources/order/order-model';
import axios from 'axios';
import { config } from '@/config/index';
import MenuModel from '@/resources/menu/menu-model';
import RiderModel from '@/resources/rider/rider-model';
import RestaurantModel from '@/resources/restaurant/model';
import {
    IOrder,
    DeliveryInfo,
    UpdateOrderStatusParams,
} from '@/resources/order/order-interface';
import {
    EmailQueueService,
    withCachedData,
    CACHE_TTL,
    generateOrderId,
} from '@/utils/index';
import {
    orderStatusUpdateEmail,
    orderCancellationEmail,
    riderAssignedEmail,
} from '@/resources/order/order-email-template';
import {
    ResourceNotFound,
    BadRequest,
    Unauthorized,
} from '@/middlewares/index';

export class OrderService {
    private order = OrderModel;
    private rider = RiderModel;
    private user = UserModel;
    private menu = MenuModel;
    private async validateUser(userId: string) {
        const user = await this.user.findById(userId);
        if (!user) {
            throw new ResourceNotFound('User not found');
        }
        return user;
    }
    private async checkOrderOwnership(
        orderId: string,
        restaurantId: string,
    ): Promise<void> {
        const order = await this.order
            .findOne({
                _id: orderId,
                restaurantId: restaurantId,
            })
            .lean();

        if (!order) {
            throw new Unauthorized(
                'Order not found or does not belong to this restaurant.',
            );
        }
    }
    private async calculateOrderAmounts(
        items: { menuId: string; quantity: number }[],
    ) {
        const itemsWithPrices = await Promise.all(
            items.map(async (item) => {
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

        const subtotal = itemsWithPrices.reduce(
            (acc, item) => acc + item.quantity * item.price,
            0,
        );

        const taxRate = parseFloat(config.TAX_RATE);
        const delivery_fee = parseFloat(config.DELIVERY_FEE);
        const tax = subtotal * taxRate;
        const total_price = subtotal + tax + delivery_fee;

        return {
            itemsWithPrices,
            roundedSubtotal: Math.round(subtotal * 100) / 100,
            roundedTax: Math.round(tax * 100) / 100,
            roundedTotalPrice: Math.round(total_price * 100) / 100,
            delivery_fee,
        };
    }
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
        console.log('service orderData', orderData);
        const user = await this.validateUser(userId);
        console.log('User validated:', { userId: user._id });

        const orderId = await generateOrderId();

        const {
            itemsWithPrices,
            roundedSubtotal,
            roundedTax,
            roundedTotalPrice,
            delivery_fee,
        } = await this.calculateOrderAmounts(orderData.items);
        console.log('Calculated total price:', roundedTotalPrice);

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

        return this.sanitizeOrder(newOrder);
    }

    public async updateOrderStatus(
        params: UpdateOrderStatusParams,
    ): Promise<Partial<IOrder>> {
        const { restaurantId, orderId, status } = params;
        await this.checkOrderOwnership(orderId, restaurantId);
        const updatedOrder = await this.order
            .findByIdAndUpdate(orderId, { status }, { new: true })
            .lean();
        if (!updatedOrder) {
            throw new ResourceNotFound('Order not found');
        }

        const user = await this.user.findById(updatedOrder.userId);
        if (user) {
            const emailOptions = orderStatusUpdateEmail(user, updatedOrder);
            await EmailQueueService.addEmailToQueue(emailOptions);
        }
        return this.sanitizeOrder(updatedOrder);
    }

    public async cancelOrder(
        params: UpdateOrderStatusParams,
    ): Promise<Partial<IOrder>> {
        const { restaurantId, orderId } = params;
        await this.checkOrderOwnership(orderId, restaurantId);
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

    public async assignRiderToOrder(
        params: UpdateOrderStatusParams,
    ): Promise<Partial<IOrder>> {
        const { restaurantId, orderId, rider_name } = params;
        await this.checkOrderOwnership(orderId, restaurantId);

        const rider = await this.rider.findOne({ name: rider_name });
        if (!rider) {
            throw new ResourceNotFound('Rider not found');
        }

        const order = await this.order
            .findByIdAndUpdate(
                orderId,
                {
                    'delivery_info.riderId': rider._id,
                    'delivery_info.rider_name': rider_name,
                },
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

    public async getOrderById(
        params: UpdateOrderStatusParams,
    ): Promise<Partial<IOrder>> {
        const { restaurantId, orderId } = params;
        await this.checkOrderOwnership(orderId, restaurantId);
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

    public async getUserOrders(
        params: UpdateOrderStatusParams,
    ): Promise<Partial<IOrder>[]> {
        // await this.checkOrderOwnership(orderId, userId);
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

    // public async getOrdersByRestaurant(
    //     restaurantId: string,
    // ): Promise<Partial<IOrder>[]> {
    //     await this.checkOrderOwnership(orderId, restaurantId);
    //     const cacheKey = `restaurant_orders:${restaurantId}`;
    //     return withCachedData<Partial<IOrder>[]>(
    //         cacheKey,
    //         async () => {
    //             const orders = await this.order
    //                 .find({ restaurantId })
    //                 .sort({ createdAt: -1 })
    //                 .lean();
    //             return orders.map((order) => this.sanitizeOrder(order));
    //         },
    //         CACHE_TTL.FIVE_MINUTES,
    //     );
    // }
}
