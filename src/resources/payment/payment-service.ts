import axios from 'axios';
import crypto from 'crypto';
import { config } from '../../config/index';
import PaymentModel from '../payment/payment-model';
import { OrderService } from '../order/order-service';
import { UserService } from '../user/user-service';
import { IOrder } from '../order/order-interface';
import { EmailQueueService, log } from '../../utils/index';
import { orderConfirmationEmail } from '../payment/payment-email-template';
import {
    ServerError,
    ResourceNotFound,
    BadRequest,
} from '../../middlewares/index';
import {
    PaystackResponse,
    PaymentResponse,
    IPayment,
    paymentProcess,
} from '../payment/payment-interface';

export class PaymentService {
    private readonly PAYSTACK_SECRET = config.PAYSTACK_SECRET_KEY;
    private readonly PAYSTACK_URL = config.PAYSTACK_URL;
    private paymentModel = PaymentModel;

    constructor(
        private orderService: OrderService,
        private userService: UserService,
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
            reference: order.order_number,
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
            await this.paymentModel.findByIdAndUpdate(payment._id, {
                status: 'failed',
            });
            throw new ServerError('Payment initialization failed');
        }
    }

    private async processSuccessfulPayment(data: any): Promise<void> {
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

        // Get user info using the updated order we already have
        const user = await this.userService.getUserById(
            updatedOrder.userId.toString(),
        );

        if (user && updatedOrder) {
            const emailOptions = orderConfirmationEmail(
                { name: user.name, email: user.email },
                updatedOrder as IOrder,
            );
            await EmailQueueService.addEmailToQueue(emailOptions);
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
            orderId: order._id.toString(),
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

    async handleWebhookEvent(
        event: string,
        data: any,
        signature: string,
        rawBody: string,
    ): Promise<boolean> {
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
}
