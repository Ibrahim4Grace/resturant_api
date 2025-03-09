import axios from 'axios';
import crypto from 'crypto';
import { config } from '../../config/index';
import PaymentModel from '../gateway/payment-model';
import SettingModel from '../settings/setting-model';
import OrderModel from '../order/order-model';
import RiderModel from '../rider/rider-model';
import { OrderService } from '../order/order-service';
import { WalletService } from '../wallet/wallet-service';
import { UserService } from '../user/user-service';
import { IOrder } from '../order/order-interface';
import { IWebhookResponse } from '../../types';
import { EmailQueueService, log } from '../../utils/index';
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

export class PaymentService {
    private readonly PAYSTACK_SECRET = config.PAYSTACK_SECRET_KEY;
    private readonly PAYSTACK_URL = config.PAYSTACK_URL;
    private paymentModel = PaymentModel;
    private settingModel = SettingModel;
    private orderModel = OrderModel;
    private rider = RiderModel;

    constructor(
        private orderService: OrderService,
        private userService: UserService,
        private walletService: WalletService,
    ) {}

    private async processCashOnDelivery(
        payment: IPayment,
        order: IOrder,
    ): Promise<PaymentResponse> {
        await this.paymentModel.findByIdAndUpdate(payment._id, {
            status: 'processing',
        });

        const updatedOrder = await this.orderService.updateOrderStatus({
            orderId: order._id.toString(),
            restaurantId: order.restaurantId.toString(),
            status: 'processing',
        });
        const user = await this.userService.getUserById(
            order.userId.toString(),
        );

        if (user && updatedOrder) {
            const emailOptions = orderConfirmationEmail(
                { name: user.name, email: user.email },
                updatedOrder as IOrder,
            );
            await EmailQueueService.addEmailToQueue(emailOptions);
        }
        return {
            success: true,
            message: 'Order confirmed for cash on delivery',
            data: {
                reference: order.order_number,
            },
        };
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
            const response = await axios.post<PaystackResponse>(
                this.PAYSTACK_URL,
                paymentData,
                {
                    headers: {
                        Authorization: `Bearer ${this.PAYSTACK_SECRET}`,
                        'Content-Type': 'application/json',
                    },
                },
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
            log.error(
                'Paystack error details:',
                error.response?.data || error.message,
            );
            await this.paymentModel.findByIdAndUpdate(payment._id, {
                status: 'failed',
            });
            throw new ServerError('Payment initialization failed');
        }
    }

    private async processSuccessfulPayment(data: any): Promise<void> {
        try {
            await this.paymentModel.findOneAndUpdate(
                { 'transactionDetails.reference': data.reference },
                { status: 'completed' },
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

            // Fetch the complete order only once
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
            log.error('Error processing successful payment:', error);
            throw error;
        }
    }

    async processPayment(params: paymentProcess): Promise<PaymentResponse> {
        const { userId, orderId, paymentMethod, userEmail } = params;
        const order = await this.userService.getUserOrderById(userId, orderId);
        if (!order) {
            throw new ResourceNotFound('Order not found');
        }

        const payment = await this.paymentModel.create({
            userId,
            orderId: order._id,
            amount: order.total_price,
            paymentMethod,
            status: 'processing',
        });

        if (paymentMethod === 'cash_on_delivery') {
            return await this.processCashOnDelivery(payment, order as IOrder);
        }

        return await this.processPaystackPayment(
            payment,
            order as IOrder,
            userEmail,
        );
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
            log.error('Payment verification error:', error);
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

        // Handle specific events
        if (event === 'charge.success') {
            const isVerified = await this.verifyPayment(data.reference);
            if (isVerified) {
                await this.processSuccessfulPayment(data);
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

            log.info(`Processed commissions for order #${order.order_number}`);
        } catch (error) {
            log.error('Error processing commissions:', error);
        }
    }

    public async processRiderPayment(order: IOrder): Promise<void> {
        try {
            if (order.status !== 'delivered') {
                return;
            }

            const settings = await this.settingModel.findOne();
            if (!settings) throw new ResourceNotFound('Settings not found');
            if (!order.delivery_info || !order.delivery_info.riderId) {
                log.warn(
                    `No rider assigned to delivered order #${order.order_number}`,
                );
                return;
            }

            const existingTransaction =
                await this.walletService.findTransactionByReference(
                    `rider-commission-${order.order_number}`,
                );

            if (existingTransaction) {
                log.info(
                    `Payment for order #${order.order_number} already processed`,
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
        } catch (error) {
            log.error('Error processing rider commission:', error);
        }
    }
}
