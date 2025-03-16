import { Channel } from 'amqplib';
import { connectRabbitMQ } from '../config';
import { OrderService } from '../resources/order/order-service';
import { UserService } from '../resources/user/user-service';
import { WalletService } from '../resources/wallet/wallet-service';
import { PaymentService } from '../resources/gateway/payment-service';
import { logger } from '../utils';
import { BadRequest, ServerError } from '../middlewares';

// Instantiate services once for all consumers
const orderService = new OrderService();
const userService = new UserService();
const walletService = new WalletService();
const paymentService = new PaymentService();

// Set dependencies
paymentService.setServices(orderService, userService, walletService);

export class OrderQueueConsumers {
    private static channel: Channel;
    private static orderQueue = 'order_creation';
    private static paymentQueue = 'payment_success';
    private static riderPaymentQueue = 'rider_payment';

    static async initializeQueues(): Promise<void> {
        this.channel = await connectRabbitMQ();
        if (!this.channel) throw new ServerError('Failed to initialize queues');

        await this.channel.assertQueue(this.orderQueue, { durable: true });
        await this.channel.assertQueue(this.paymentQueue, { durable: true });
        await this.channel.assertQueue(this.riderPaymentQueue, {
            durable: true,
        });
        logger.info('Order, payment, and rider payment queues initialized');
    }

    static async startAllConsumers(): Promise<void> {
        if (!this.channel) {
            throw new Error(
                'Channel not initialized. Call initializeQueues first.',
            );
        }

        // Start all consumers
        await Promise.all([
            this.startOrderCreationConsumer(),
            this.startPaymentSuccessConsumer(),
            this.startRiderPaymentConsumer(),
        ]);
    }

    private static async startOrderCreationConsumer(): Promise<void> {
        this.channel.prefetch(10);
        logger.info('Waiting for order creation messages...');

        this.channel.consume(this.orderQueue, async (msg) => {
            if (msg === null) return;

            try {
                const { userId, userEmail, orderData } = JSON.parse(
                    msg.content.toString(),
                );
                logger.info(`Processing order creation for user ${userId}`);

                const order = await orderService.placeOrder(userId, orderData);

                let paymentResult;
                if (orderData.payment_method === 'cash_on_delivery') {
                    paymentResult = await paymentService.processPayment({
                        userId,
                        orderId: order._id.toString(),
                        paymentMethod: 'cash_on_delivery',
                        userEmail,
                    });
                } else if (orderData.payment_method === 'transfer') {
                    paymentResult = await paymentService.processPayment({
                        userId,
                        orderId: order._id.toString(),
                        paymentMethod: 'transfer',
                        userEmail,
                    });
                } else {
                    throw new BadRequest('Invalid payment method');
                }

                logger.info(
                    `Successfully processed order #${order.order_number}`,
                );
                this.channel.ack(msg);
            } catch (error) {
                logger.error('Error processing order creation:', error.message);
                this.channel.nack(msg, false, false);
            }
        });
    }

    private static async startPaymentSuccessConsumer(): Promise<void> {
        this.channel.prefetch(10);
        logger.info('Waiting for payment success messages...');

        this.channel.consume(this.paymentQueue, async (msg) => {
            if (msg === null) return;

            try {
                const data = JSON.parse(msg.content.toString());
                logger.info(
                    `Processing payment success for reference ${data.reference}`,
                );

                await paymentService.processSuccessfulPayment(data);

                logger.info(
                    `Successfully processed payment for reference ${data.reference}`,
                );
                this.channel.ack(msg);
            } catch (error) {
                logger.error(
                    'Error processing payment success:',
                    error.message,
                );
                this.channel.nack(msg, false, false);
            }
        });
    }

    private static async startRiderPaymentConsumer(): Promise<void> {
        this.channel.prefetch(10);
        logger.info('Waiting for rider payment messages...');

        this.channel.consume(this.riderPaymentQueue, async (msg) => {
            if (msg === null) return;

            try {
                const order = JSON.parse(msg.content.toString());
                logger.info(
                    `Processing rider payment for order #${order.order_number}`,
                );

                await paymentService.processRiderPayment(order);

                logger.info(
                    `Successfully processed rider payment for order #${order.order_number}`,
                );
                this.channel.ack(msg);
            } catch (error) {
                logger.error('Error processing rider payment:', error.message);
                this.channel.nack(msg, false, false);
            }
        });
    }
}
