"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentService = void 0;
const axios_1 = __importDefault(require("axios"));
const index_1 = require("@/config/index");
const crypto_1 = __importDefault(require("crypto"));
const payment_model_1 = __importDefault(require("@/resources/payment/payment-model"));
const index_2 = require("@/utils/index");
const index_3 = require("@/middlewares/index");
const order_email_template_1 = require("@/resources/order/order-email-template");
class PaymentService {
    constructor(orderService, userService) {
        this.orderService = orderService;
        this.userService = userService;
        this.PAYSTACK_SECRET = index_1.config.PAYSTACK_SECRET_KEY;
        this.PAYSTACK_URL = index_1.config.PAYSTACK_URL;
        this.paymentModel = payment_model_1.default;
    }
    async processCashOnDelivery(payment, order) {
        await this.paymentModel.findByIdAndUpdate(payment._id, {
            status: 'processing',
        });
        await this.orderService.updateOrderStatus({
            orderId: order._id.toString(),
            restaurantId: order.restaurantId.toString(),
            status: 'processing',
        });
        return {
            success: true,
            message: 'Order confirmed for cash on delivery',
            data: {
                reference: order.order_number,
            },
        };
    }
    async processPaystackPayment(payment, order, userEmail) {
        const paymentData = {
            amount: order.total_price * 100,
            email: userEmail,
            reference: order.order_number,
            metadata: {
                order_id: order._id,
                restaurant_id: order.restaurantId,
                user_id: order.userId,
            },
            callback_url: index_1.config.PAYMENT_CALLBACK_URL,
        };
        try {
            const response = await axios_1.default.post(this.PAYSTACK_URL, paymentData, {
                headers: {
                    Authorization: `Bearer ${this.PAYSTACK_SECRET}`,
                    'Content-Type': 'application/json',
                },
            });
            await this.paymentModel.findByIdAndUpdate(payment._id, {
                transactionDetails: {
                    reference: response.data.data.reference,
                    authorizationUrl: response.data.data.authorization_url,
                },
            });
            return {
                success: true,
                message: 'Payment initialized successfully',
                data: {
                    authorization_url: response.data.data.authorization_url,
                    reference: response.data.data.reference,
                },
            };
        }
        catch (error) {
            await this.paymentModel.findByIdAndUpdate(payment._id, {
                status: 'failed',
            });
            throw new index_3.ServerError('Payment initialization failed');
        }
    }
    async processSuccessfulPayment(data) {
        await this.paymentModel.findOneAndUpdate({ 'transactionDetails.reference': data.reference }, { status: 'completed' });
        await this.orderService.updateOrderStatus({
            orderId: data.metadata.order_id,
            restaurantId: data.metadata.restaurant_id,
            status: 'processing',
        });
        // Send email confirmation
        const order = await this.orderService.getOrderById(data.metadata.order_id);
        const user = await this.userService.getUserById(order.userId.toString());
        if (user && order) {
            const emailOptions = (0, order_email_template_1.orderConfirmationEmail)({ name: user.name, email: user.email }, order);
            await index_2.EmailQueueService.addEmailToQueue(emailOptions);
        }
    }
    async processPayment(params) {
        const { userId, orderId, paymentMethod, userEmail } = params;
        const order = await this.userService.getUserOrder(userId, orderId);
        if (!order) {
            throw new index_3.ResourceNotFound('Order not found');
        }
        const payment = await this.paymentModel.create({
            userId,
            orderId: order._id.toString(),
            amount: order.total_price,
            paymentMethod,
            status: 'processing',
        });
        if (paymentMethod === 'cash_on_delivery') {
            return await this.processCashOnDelivery(payment, order);
        }
        return await this.processPaystackPayment(payment, order, userEmail);
    }
    async verifyPayment(reference) {
        try {
            const response = await axios_1.default.get(`https://api.paystack.co/transaction/verify/${reference}`, {
                headers: {
                    Authorization: `Bearer ${this.PAYSTACK_SECRET}`,
                },
            });
            return response.data.data.status === 'success';
        }
        catch (error) {
            console.error('Payment verification error:', error);
            return false;
        }
    }
    verifyWebhookSignature(data, signature) {
        const hash = crypto_1.default
            .createHmac('sha512', this.PAYSTACK_SECRET)
            .update(JSON.stringify(data))
            .digest('hex');
        return hash === signature;
    }
    async handleWebhookEvent(event, data, signature) {
        const isValidSignature = this.verifyWebhookSignature(data, signature);
        if (!isValidSignature) {
            return false;
        }
        if (event === 'charge.success') {
            const isVerified = await this.verifyPayment(data.reference);
            if (isVerified) {
                await this.processSuccessfulPayment(data);
                return true;
            }
        }
        return false;
    }
}
exports.PaymentService = PaymentService;
//# sourceMappingURL=payment-service.js.map