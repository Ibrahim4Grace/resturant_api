import axios from 'axios';
import { config } from '../../config/index';
import crypto from 'crypto';
import PaymentModel from '../../resources/payment/payment-model';
import { OrderService } from '../../resources/order/order-service';
import { UserService } from '../../resources/user/user-service';
import { IOrder } from '../../resources/order/order-interface';
import { EmailQueueService } from '../../utils/index';
import { ServerError, ResourceNotFound } from '../../middlewares/index';
import { orderConfirmationEmail } from '../../resources/order/order-email-template';
import {
    PaystackResponse,
    PaymentResponse,
    IPayment,
    paymentProcess,
} from '../../resources/payment/payment-interface';

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

        await this.orderService.updateOrderStatus({
            orderId: data.metadata.order_id,
            restaurantId: data.metadata.restaurant_id,
            status: 'processing',
        });

        // Send email confirmation
        const order = await this.orderService.getOrderById(
            data.metadata.order_id,
        );
        const user = await this.userService.getUserById(
            order.userId.toString(),
        );

        if (user && order) {
            const emailOptions = orderConfirmationEmail(
                { name: user.name, email: user.email },
                order as IOrder,
            );
            await EmailQueueService.addEmailToQueue(emailOptions);
        }
    }

    async processPayment(params: paymentProcess): Promise<PaymentResponse> {
        const { userId, orderId, paymentMethod, userEmail } = params;
        const order = await this.userService.getUserOrder(userId, orderId);
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
            console.error('Payment verification error:', error);
            return false;
        }
    }

    private verifyWebhookSignature(data: string, signature: string): boolean {
        const hash = crypto
            .createHmac('sha512', this.PAYSTACK_SECRET)
            .update(data) // Use the raw body directly
            .digest('hex');

        return hash === signature;
    }

    async handleWebhookEvent(
        event: string,
        data: any,
        signature: string,
        rawBody: string, // Accept raw body for logging
    ): Promise<boolean> {
        console.log('🔔 Webhook received');
        console.log('Event Type:', event);
        console.log('Payload Data:', JSON.stringify(data, null, 2));
        console.log('Signature:', signature);

        // Verify the webhook signature
        const isValidSignature = this.verifyWebhookSignature(
            rawBody,
            signature,
        );
        if (!isValidSignature) {
            console.error('⚠️ Invalid webhook signature');
            return false;
        }

        // Handle specific events
        if (event === 'charge.success') {
            console.log('Processing charge.success event...');
            const isVerified = await this.verifyPayment(data.reference);
            if (isVerified) {
                console.log(
                    'Payment verified. Processing successful payment...',
                );
                await this.processSuccessfulPayment(data);
                return true;
            } else {
                console.error('⚠️ Payment verification failed');
                return false;
            }
        }

        console.warn(`⚠️ Unhandled event type: ${event}`);
        return false;
    }

    // private verifyWebhookSignature(data: string, signature: string): boolean {
    //     const hash = crypto
    //         .createHmac('sha512', this.PAYSTACK_SECRET)
    //         .update(data) // Use the raw body directly
    //         .digest('hex');

    //     return hash === signature;
    // }

    // async handleWebhookEvent(
    //     event: string,
    //     data: any,
    //     signature: string,
    // ): Promise<boolean> {
    //     const isValidSignature = this.verifyWebhookSignature(data, signature);
    //     if (!isValidSignature) {
    //         console.error('Invalid webhook signature');
    //         return false;
    //     }

    //     if (event === 'charge.success') {
    //         const isVerified = await this.verifyPayment(data.reference);
    //         if (isVerified) {
    //             await this.processSuccessfulPayment(data);
    //             return true;
    //         }
    //     }

    //     return false;
    // }
}
