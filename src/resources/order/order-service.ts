import { Request, Response } from 'express';
import UserModel from '../user/user-model';
import OrderModel from '../order/order-model';
import MenuModel from '../menu/menu-model';
import { PaymentService } from '../gateway/payment-service';
import { EmailQueueService } from '../../jobs';
import {
    IOrderPaginatedResponse,
    IPaginatedEntityResponse,
    IPaginationResponse,
} from '../../types';
import {
    ResourceNotFound,
    BadRequest,
    Unauthorized,
    ServerError,
} from '../../middlewares';
import {
    IOrder,
    DeliveryInfo,
    UpdateOrderStatusParams,
} from '../order/order-interface';
import {
    withCachedData,
    CACHE_TTL,
    generateOrderId,
    getPaginatedAndCachedResults,
    deleteCacheData,
    CACHE_KEYS,
} from '../../utils';
import {
    orderStatusUpdateEmail,
    orderCancellationEmail,
} from '../order/order-email-template';
import {
    orderData,
    validateUser,
    checkOrderOwnership,
    calculateOrderAmounts,
} from '../order/order-helper';

export class OrderService {
    private order = OrderModel;
    private menu = MenuModel;
    private user = UserModel;
    private orderData = orderData;
    private validateUser = validateUser;
    private checkOrderOwnership = checkOrderOwnership;
    private calculateOrderAmounts = calculateOrderAmounts;
    private paymentService: PaymentService;
    constructor() {
        // No dependencies in constructor
    }

    setPaymentService(paymentService: PaymentService) {
        this.paymentService = paymentService;
    }

    public async placeOrder(
        userId: string,
        orderData: {
            items: { menuId: string; quantity: number }[];
            restaurantId: string;
            delivery_address: string;
            payment_method: string;
        },
    ): Promise<Partial<IOrder>> {
        await this.validateUser(userId, this.user);

        const order_number = await generateOrderId();

        const {
            itemsWithPrices,
            roundedSubtotal,
            roundedTax,
            roundedTotalPrice,
            delivery_fee,
        } = await this.calculateOrderAmounts(orderData.items, this.menu);

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
            payment_method: orderData.payment_method,
        });

        return this.orderData(newOrder);
    }

    public async confirmDelivery(params: {
        orderId: string;
        restaurantId: string;
    }): Promise<IOrder> {
        const { orderId, restaurantId } = params;

        const order = await this.order.findById(orderId);
        if (!order) throw new ResourceNotFound('Order not found');

        if (order.restaurantId.toString() !== restaurantId.toString()) {
            throw new Unauthorized(
                'You are not authorized to confirm payment for this order',
            );
        }

        if (order.payment_method !== 'cash_on_delivery') {
            throw new BadRequest(
                'This operation is only valid for cash on delivery orders',
            );
        }
        await this.paymentService.processCashOnDelivery(orderId);

        // Mark as confirmed
        const updatedOrder = await this.order.findByIdAndUpdate(
            orderId,
            {
                status: 'delivered',
                delivery_confirmed: true,
                'delivery_info.customerConfirmationTime': new Date(),
            },
            { new: true },
        );

        if (!updatedOrder) throw new ResourceNotFound('Order not found');

        await Promise.all([
            deleteCacheData(CACHE_KEYS.ORDER_BY_ID(orderId)),
            deleteCacheData(CACHE_KEYS.ALL_RESTAURANT_ORDERS(restaurantId)),
        ]);

        return updatedOrder;
    }

    public async updateOrderStatus(
        params: UpdateOrderStatusParams,
    ): Promise<Partial<IOrder>> {
        const { restaurantId, orderId, status } = params;
        await this.checkOrderOwnership(orderId, restaurantId, this.order);

        const updatedOrder = await this.order
            .findByIdAndUpdate(orderId, { status }, { new: true })
            .lean();
        if (!updatedOrder) {
            throw new ResourceNotFound('Order not found');
        }

        await Promise.all([
            deleteCacheData(CACHE_KEYS.ALL_ORDERS),
            deleteCacheData(CACHE_KEYS.ORDER_BY_ID(orderId)),
            deleteCacheData(CACHE_KEYS.ALL_USER_ORDER(restaurantId)),
        ]);

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
        await this.checkOrderOwnership(orderId, restaurantId, this.order);
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
        await this.checkOrderOwnership(orderId, restaurantId, this.order);
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
        );

        return {
            results: paginatedResults.results.map(
                (order) => orderData(order) as IOrder,
            ),
            pagination: {
                currentPage: paginatedResults.currentPage,
                totalPages: paginatedResults.totalPages,
                limit: paginatedResults.limit,
            },
        };
    }

    public async getAllCashOnDeliveryOrders(
        paginatedResults: IPaginatedEntityResponse<IOrder>,
    ): Promise<{
        results: Partial<IOrder>[];
        pagination: IPaginationResponse;
    }> {
        if (!paginatedResults) {
            throw new ServerError('Pagination results not found');
        }

        const sanitizedResults = paginatedResults.results.map((order) =>
            this.orderData(order),
        );
        return {
            results: sanitizedResults,
            pagination: paginatedResults.pagination,
        };
    }
}
