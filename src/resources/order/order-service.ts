import { Request, Response } from 'express';
import UserModel from '../user/user-model';
import OrderModel from '../order/order-model';
import { IOrderPaginatedResponse } from '../../types/index';
import {
    IOrder,
    DeliveryInfo,
    UpdateOrderStatusParams,
} from '../order/order-interface';
import {
    EmailQueueService,
    withCachedData,
    CACHE_TTL,
    generateOrderId,
    getPaginatedAndCachedResults,
    CACHE_KEYS,
} from '../../utils/index';
import {
    orderStatusUpdateEmail,
    orderCancellationEmail,
} from '../order/order-email-template';
import { ResourceNotFound, BadRequest } from '../../middlewares/index';

import {
    orderData,
    validateUser,
    checkOrderOwnership,
    calculateOrderAmounts,
} from '../order/order-helper';

export class OrderService {
    private order = OrderModel;
    private user = UserModel;
    private orderData = orderData;
    private validateUser = validateUser;
    private checkOrderOwnership = checkOrderOwnership;
    private calculateOrderAmounts = calculateOrderAmounts;

    public async placeOrder(
        userId: string,
        orderData: {
            items: { menuId: string; quantity: number }[];
            restaurantId: string;
            delivery_address: string;
        },
    ): Promise<Partial<IOrder>> {
        await this.validateUser(userId);

        const order_number = await generateOrderId();

        const {
            itemsWithPrices,
            roundedSubtotal,
            roundedTax,
            roundedTotalPrice,
            delivery_fee,
        } = await this.calculateOrderAmounts(orderData.items);

        const delivery_info: DeliveryInfo = {
            delivery_address: orderData.delivery_address,
        };

        const newOrder = await this.order.create({
            order_number,
            userId,
            delivery_info,
            restaurantId: orderData.restaurantId,
            items: itemsWithPrices,
            subtotal: roundedSubtotal,
            tax: roundedTax,
            delivery_fee,
            total_price: roundedTotalPrice,
        });

        return this.orderData(newOrder);
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
        return this.orderData(updatedOrder);
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

        return this.orderData(updatedOrder!);
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
                return this.orderData(order);
            },
            CACHE_TTL.FIVE_MINUTES,
        );
    }

    public async fecthUserOrders(
        req: Request,
        res: Response,
        restaurantId: string,
    ): Promise<IOrderPaginatedResponse> {
        const paginatedResults = await getPaginatedAndCachedResults<IOrder>(
            req,
            res,
            this.order,
            CACHE_KEYS.ALL_USER_ORDER(restaurantId),
            { restaurantId },
            {
                orderId: 1,
                status: 1,
                total_price: 1,
                userId: 1,
                restaurantId: 1,
                items: 1,
                subtotal: 1,
                tax: 1,
                delivery_fee: 1,
                delivery_info: 1,
                createdAt: 1,
                updatedAt: 1,
            },
        );

        return {
            results: paginatedResults.results,
            pagination: {
                currentPage: paginatedResults.currentPage,
                totalPages: paginatedResults.totalPages,
                limit: paginatedResults.limit,
            },
        };
    }
}
