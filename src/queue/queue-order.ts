import { connectRabbitMQ } from '../config';
import { log } from '../utils';
import { OrderService } from '../resources/order/order-service';
import { PaymentService } from '../resources/gateway/payment-service';
import { UserService } from '../resources/user/user-service';
import { WalletService } from '../resources/wallet/wallet-service';

const ORDER_QUEUE_NAME = 'orderQueue';

export class OrderQueueService {
    static async initializeOrderQueue(): Promise<void> {
        try {
            const channel = await connectRabbitMQ();
            await channel.assertQueue(ORDER_QUEUE_NAME, { durable: true });
            log.info(`Order queue "${ORDER_QUEUE_NAME}" initialized`);
        } catch (error) {
            log.error('Failed to initialize order queue:', error);
            throw error;
        }
    }

    static async addOrderToQueue(orderData: any): Promise<void> {
        try {
            const channel = await connectRabbitMQ();
            channel.sendToQueue(
                ORDER_QUEUE_NAME,
                Buffer.from(JSON.stringify(orderData)),
                { persistent: true },
            );
            log.info(
                'Order added to queue:',
                orderData.order_number || orderData,
            );
        } catch (error) {
            log.error('Failed to add order to queue:', error);
            throw error;
        }
    }

    // Worker method as a static class method
    static async startOrderWorker(): Promise<void> {
        try {
            const channel = await connectRabbitMQ();
            await channel.assertQueue(ORDER_QUEUE_NAME, { durable: true });

            // Initialize services
            const userService = new UserService();
            const walletService = new WalletService();
            const orderService = new OrderService(null as any); // Temporary null
            const paymentService = new PaymentService(
                orderService,
                userService,
                walletService,
            );
            orderService['paymentService'] = paymentService; // Inject after creation

            log.info(`Worker started, listening to "${ORDER_QUEUE_NAME}"`);

            channel.consume(
                ORDER_QUEUE_NAME,
                async (msg) => {
                    if (msg) {
                        try {
                            const orderData = JSON.parse(
                                msg.content.toString(),
                            );
                            const {
                                userId,
                                orderInput,
                                paymentMethod,
                                userEmail,
                            } = orderData;

                            // Place the order
                            const order = await orderService.placeOrder(
                                userId,
                                orderInput,
                            );

                            // Process payment
                            await paymentService.processPayment({
                                userId,
                                orderId: order._id.toString(),
                                paymentMethod,
                                userEmail,
                            });

                            log.info(`Order processed: ${order.order_number}`);
                            channel.ack(msg); // Acknowledge success
                        } catch (error) {
                            log.error('Error processing order:', error);
                            channel.nack(msg, false, true); // Requeue for retry
                        }
                    }
                },
                { noAck: false },
            );
        } catch (error) {
            log.error('Worker failed to start:', error);
        }
    }
}
