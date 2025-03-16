import axios from 'axios';
import { Agent } from 'https';
import crypto from 'crypto';
import { config, connectRabbitMQ } from '../../config';
import axiosRetry from 'axios-retry';
import { logger } from '../../utils';
import PaymentModel from '../gateway/payment-model';
import SettingModel from '../settings/setting-model';
import OrderModel from '../order/order-model';
import RiderModel from '../rider/rider-model';
import { OrderService } from '../order/order-service';
import { WalletService } from '../wallet/wallet-service';
import { UserService } from '../user/user-service';
import { IOrder } from '../order/order-interface';
import { IWebhookResponse } from '../../types';
import { EmailQueueService } from '../../jobs';
import { orderConfirmationEmail } from '../gateway/payment-email-template';
import {
    PaystackResponse,
    PaymentResponse,
    IPayment,
    paymentProcess,
} from '../gateway/payment-interface';
import {
    ServerError,
    ResourceNotFound,
    BadRequest,
} from '../../middlewares/index';

// Configure Axios for Paystack with retries and keep-alive
const paystackClient = axios.create({
    baseURL: config.PAYSTACK_URL,
    headers: {
        Authorization: `Bearer ${config.PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json',
    },
    //HTTP Keep-Alive reuses TCP connections reducing the overhead
    // of establishing new connections for each Paystack request.
    httpsAgent: new Agent({ keepAlive: true }),
});
axiosRetry(paystackClient, {
    retries: 3,
    retryDelay: (retryCount) => retryCount * 1000, // 1s, 2s, 3s
    retryCondition: (error) => {
        return error.response?.status === 429 || error.response?.status >= 500;
    },
});

export class PaymentService {
    private readonly PAYSTACK_SECRET = config.PAYSTACK_SECRET_KEY;
    private readonly PAYSTACK_URL = `${config.PAYSTACK_URL}/transaction/initialize`;
    private paymentModel = PaymentModel;
    private settingModel = SettingModel;
    private orderModel = OrderModel;
    private rider = RiderModel;
    private orderService: OrderService;
    private userService: UserService;
    private walletService: WalletService;

    constructor() {
        // No dependencies in constructor
    }

    setServices(
        orderService: OrderService,
        userService: UserService,
        walletService: WalletService,
    ) {
        this.orderService = orderService;
        this.userService = userService;
        this.walletService = walletService;
    }

    async processCashOnDelivery(orderId: string): Promise<void> {
        try {
            const payment = await this.paymentModel.findOne({
                orderId,
                paymentMethod: 'cash_on_delivery',
            });

            if (!payment)
                throw new ResourceNotFound('Payment record not found');
            await this.paymentModel.findByIdAndUpdate(payment._id, {
                status: 'completed',
                completedAt: new Date(),
            });

            const order = await this.orderModel.findById(orderId);
            if (!order) throw new ResourceNotFound('Order not found');

            logger.info(
                `Cash payment completed for order #${order.order_number}`,
            );
            const user = await this.userService.getUserById(
                order.userId.toString(),
            );

            if (user && order) {
                const emailOptions = orderConfirmationEmail(
                    { name: user.name, email: user.email },
                    order,
                );
                await EmailQueueService.addEmailToQueue(emailOptions);
                logger.info(
                    `Order confirmation email queued for ${user.email}`,
                );
            }
        } catch (error) {
            logger.error('Error completing cash on delivery payment:', error);
            throw error;
        }
    }

    private async processPaystackPayment(
        payment: IPayment,
        order: IOrder,
        userEmail: string,
    ): Promise<PaymentResponse> {
        const paymentData = {
            amount: order.total_price * 100,
            email: userEmail,
            // reference: order.order_number,
            metadata: {
                order_id: order._id,
                restaurant_id: order.restaurantId,
                user_id: order.userId,
            },
            callback_url: config.PAYMENT_CALLBACK_URL,
        };
        try {
            const response = await paystackClient.post<PaystackResponse>(
                this.PAYSTACK_URL,
                paymentData,
            );

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
        } catch (error) {
            logger.error(
                'Paystack error details:',
                error.response?.data || error.message,
            );
            await this.paymentModel.findByIdAndUpdate(payment._id, {
                status: 'failed',
            });
            throw new ServerError('Payment initialization failed');
        }
    }

    async processPayment(params: paymentProcess): Promise<PaymentResponse> {
        const { userId, orderId, paymentMethod, userEmail } = params;
        const order = await this.userService.getUserOrderById(userId, orderId);
        if (!order) throw new ResourceNotFound('Order not found');

        const payment = await this.paymentModel.create({
            userId,
            orderId: order._id,
            amount: order.total_price,
            paymentMethod,
            status: 'processing',
        });

        if (paymentMethod === 'cash_on_delivery') {
            await this.processCashOnDelivery(orderId);
            return {
                success: true,
                message: 'Order confirmed for cash on delivery',
                data: {
                    reference: order.order_number,
                },
            };
        }

        return await this.processPaystackPayment(
            payment,
            order as IOrder,
            userEmail,
        );
    }

    async processSuccessfulPayment(data: any): Promise<void> {
        try {
            await this.paymentModel.findOneAndUpdate(
                { 'transactionDetails.reference': data.reference },
                { status: 'completed' },
                { new: true },
            );

            // Store these values to reuse
            const orderId = data.metadata.order_id;
            const restaurantId = data.metadata.restaurant_id;
            const updatedOrder = await this.orderService.updateOrderStatus({
                orderId,
                restaurantId,
                status: 'processing',
            });

            const user = await this.userService.getUserById(
                updatedOrder.userId.toString(),
            );

            let completeOrder = null;
            if (updatedOrder) {
                completeOrder = await this.orderModel.findById(orderId);
                if (!completeOrder)
                    throw new ResourceNotFound('Order not completed');
            }

            if (user && completeOrder) {
                const emailOptions = orderConfirmationEmail(
                    { name: user.name, email: user.email },
                    completeOrder,
                );
                await EmailQueueService.addEmailToQueue(emailOptions);
            }

            if (completeOrder) {
                await this.processRestaurantCommissions(completeOrder);
            }
        } catch (error) {
            logger.error('Error processing successful payment:', error);
            throw error;
        }
    }

    async verifyPayment(reference: string): Promise<boolean> {
        try {
            const response = await axios.get(
                `https://api.paystack.co/transaction/verify/${reference}`,
                {
                    headers: {
                        Authorization: `Bearer ${this.PAYSTACK_SECRET}`,
                    },
                },
            );

            return response.data.data.status === 'success';
        } catch (error) {
            logger.error('Payment verification error:', error);
            return false;
        }
    }

    private verifyWebhookSignature(data: string, signature: string): boolean {
        const hash = crypto
            .createHmac('sha512', this.PAYSTACK_SECRET)
            .update(data)
            .digest('hex');

        return hash === signature;
    }

    async handleWebhookEvent(params: IWebhookResponse): Promise<boolean> {
        const { event, data, signature, rawBody } = params;
        const isValidSignature = this.verifyWebhookSignature(
            rawBody,
            signature,
        );
        if (!isValidSignature) {
            throw new BadRequest('Invalid webhook signature');
        }

        if (event === 'charge.success') {
            const isVerified = await this.verifyPayment(data.reference);
            if (isVerified) {
                // Publish to RabbitMQ queue instead of processing synchronously
                const channel = await connectRabbitMQ();
                if (!channel) {
                    throw new ServerError('Failed to connect to message queue');
                }

                const queue = 'payment_success';
                await channel.assertQueue(queue, { durable: true });
                channel.sendToQueue(queue, Buffer.from(JSON.stringify(data)), {
                    persistent: true,
                });
                logger.info(
                    `Payment success event for reference ${data.reference} sent to queue`,
                );
                return true;
            } else {
                return false;
            }
        }
        return false;
    }

    private async processRestaurantCommissions(order: IOrder): Promise<void> {
        try {
            // Get settings for commission rates
            const settings = await this.settingModel.findOne();
            if (!settings) throw new Error('Settings not found');

            const orderAmount = order.total_price;
            const restaurantCommissionAmount =
                orderAmount * settings.restaurant_commission;

            await this.walletService.addTransaction({
                userId: order.restaurantId.toString(),
                userType: 'restaurant',
                amount: restaurantCommissionAmount,
                type: 'credit',
                description: `Commission from order #${order.order_number}`,
                reference: `restaurant-commission-${order.order_number}`,
            });

            logger.info(
                `Processed commissions for order #${order.order_number}`,
            );
        } catch (error) {
            logger.error('Error processing commissions:', error);
        }
    }

    public async processRiderPayment(order: IOrder): Promise<void> {
        try {
            if (order.status !== 'delivered') {
                return;
            }

            if (order.delivery_confirmed) {
                logger.info(
                    `Order #${order.order_number} already confirmed, skipping`,
                );
                return;
            }

            const settings = await this.settingModel.findOne();
            if (!settings) throw new ResourceNotFound('Settings not found');

            if (!order.delivery_info || !order.delivery_info.riderId) {
                logger.warn(
                    `No rider assigned to delivered order #${order.order_number}`,
                );
                return;
            }

            const existingTransaction =
                await this.walletService.findTransactionByReference(
                    `rider-commission-${order.order_number}`,
                );

            if (existingTransaction) {
                logger.info(
                    `Payment for order #${order.order_number} already processed`,
                );
                // Mark as confirmed to prevent reprocessing
                await OrderModel.updateOne(
                    { _id: order._id },
                    { $set: { delivery_confirmed: true } },
                );
                return;
            }

            const orderAmount = order.total_price;
            const riderCommissionAmount =
                orderAmount * settings.rider_commission;

            await this.walletService.addTransaction({
                userId: order.delivery_info.riderId.toString(),
                userType: 'rider',
                amount: riderCommissionAmount,
                type: 'credit',
                description: `Delivery commission for order #${order.order_number}`,
                reference: `rider-commission-${order.order_number}`,
            });

            const rider = await this.rider.findById(
                order.delivery_info.riderId,
            );
            if (!rider) throw new Error('Rider not found');

            await this.rider.findByIdAndUpdate(order.delivery_info.riderId, {
                status: 'available',
            });

            await OrderModel.updateOne(
                { _id: order._id },
                { $set: { delivery_confirmed: true } },
            );
        } catch (error) {
            logger.error('Error processing rider commission:', error);
        }
    }
}
