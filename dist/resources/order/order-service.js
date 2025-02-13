"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrderService = void 0;
const user_model_1 = __importDefault(require("@/resources/user/user-model"));
const order_model_1 = __importDefault(require("@/resources/order/order-model"));
const index_1 = require("@/config/index");
const menu_model_1 = __importDefault(require("@/resources/menu/menu-model"));
const rider_model_1 = __importDefault(require("@/resources/rider/rider-model"));
const index_2 = require("@/utils/index");
const order_email_template_1 = require("@/resources/order/order-email-template");
const index_3 = require("@/middlewares/index");
class OrderService {
    constructor() {
        this.order = order_model_1.default;
        this.rider = rider_model_1.default;
        this.user = user_model_1.default;
        this.menu = menu_model_1.default;
        this.CACHE_KEYS = {
            ALL_USER_ORDER: (restaurantId) => `all_user_order${restaurantId}`,
        };
    }
    async validateUser(userId) {
        const user = await this.user.findById(userId);
        if (!user) {
            throw new index_3.ResourceNotFound('User not found');
        }
        return user;
    }
    async checkOrderOwnership(orderId, restaurantId) {
        const order = await this.order
            .findOne({
            _id: orderId,
            restaurantId: restaurantId,
        })
            .lean();
        if (!order) {
            throw new index_3.Unauthorized('Order not found or does not belong to this restaurant.');
        }
    }
    async calculateOrderAmounts(items) {
        const itemsWithPrices = await Promise.all(items.map(async (item) => {
            const menuItem = await this.menu.findById(item.menuId);
            if (!menuItem) {
                throw new index_3.ResourceNotFound(`Menu item with ID ${item.menuId} not found`);
            }
            return {
                ...item,
                price: menuItem.price,
                name: menuItem.name,
            };
        }));
        const subtotal = itemsWithPrices.reduce((acc, item) => acc + item.quantity * item.price, 0);
        const taxRate = parseFloat(index_1.config.TAX_RATE);
        const delivery_fee = parseFloat(index_1.config.DELIVERY_FEE);
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
    sanitizeOrder(order) {
        return {
            order_number: order.order_number,
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
    async placeOrder(userId, orderData) {
        const user = await this.validateUser(userId);
        const order_number = await (0, index_2.generateOrderId)();
        const { itemsWithPrices, roundedSubtotal, roundedTax, roundedTotalPrice, delivery_fee, } = await this.calculateOrderAmounts(orderData.items);
        const delivery_info = { address: orderData.address };
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
        return this.sanitizeOrder(newOrder);
    }
    async updateOrderStatus(params) {
        const { restaurantId, orderId, status } = params;
        await this.checkOrderOwnership(orderId, restaurantId);
        const updatedOrder = await this.order
            .findByIdAndUpdate(orderId, { status }, { new: true })
            .lean();
        if (!updatedOrder) {
            throw new index_3.ResourceNotFound('Order not found');
        }
        const user = await this.user.findById(updatedOrder.userId);
        if (user) {
            const emailOptions = (0, order_email_template_1.orderStatusUpdateEmail)(user, updatedOrder);
            await index_2.EmailQueueService.addEmailToQueue(emailOptions);
        }
        return this.sanitizeOrder(updatedOrder);
    }
    async cancelOrder(params) {
        const { restaurantId, orderId } = params;
        await this.checkOrderOwnership(orderId, restaurantId);
        const order = await this.order.findById(orderId).lean();
        if (!order) {
            throw new index_3.ResourceNotFound('Order not found');
        }
        if (order.status !== 'pending' && order.status !== 'processing') {
            throw new index_3.BadRequest('Order cannot be cancelled');
        }
        const updatedOrder = await this.order
            .findByIdAndUpdate(orderId, { status: 'cancelled' }, { new: true })
            .lean();
        const user = await this.user.findById(order.userId);
        if (user) {
            const emailOptions = (0, order_email_template_1.orderCancellationEmail)(user, updatedOrder);
            await index_2.EmailQueueService.addEmailToQueue(emailOptions);
        }
        return this.sanitizeOrder(updatedOrder);
    }
    async assignRiderToOrder(params) {
        const { restaurantId, orderId, rider_name } = params;
        await this.checkOrderOwnership(orderId, restaurantId);
        const rider = await this.rider.findOne({ name: rider_name });
        if (!rider) {
            throw new index_3.ResourceNotFound('Rider not found');
        }
        const order = await this.order
            .findByIdAndUpdate(orderId, {
            'delivery_info.riderId': rider._id,
            'delivery_info.rider_name': rider_name,
        }, { new: true })
            .lean();
        if (!order) {
            throw new index_3.ResourceNotFound('Order not found');
        }
        const user = await this.user.findById(order.userId);
        if (user) {
            const emailOptions = (0, order_email_template_1.riderAssignedEmail)(user, order);
            await index_2.EmailQueueService.addEmailToQueue(emailOptions);
        }
        return this.sanitizeOrder(order);
    }
    async getOrderById(params) {
        const { restaurantId, orderId } = params;
        await this.checkOrderOwnership(orderId, restaurantId);
        const cacheKey = `order:${orderId}`;
        return (0, index_2.withCachedData)(cacheKey, async () => {
            const order = await this.order.findById(orderId).lean();
            if (!order) {
                throw new index_3.ResourceNotFound('Order not found');
            }
            return this.sanitizeOrder(order);
        }, index_2.CACHE_TTL.FIVE_MINUTES);
    }
    async fecthUserOrders(req, res, restaurantId) {
        const paginatedResults = await (0, index_2.getPaginatedAndCachedResults)(req, res, this.order, this.CACHE_KEYS.ALL_USER_ORDER(restaurantId), { restaurantId }, {
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
        });
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
exports.OrderService = OrderService;
//# sourceMappingURL=order-service.js.map