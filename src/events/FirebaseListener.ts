import { connectRabbitMQ } from '../config/rabbitmq';
import { sendFirebaseNotification, log } from '../utils/index';
import { NotificationEventTypes } from '../events/index';

const EXCHANGE_NAME = 'events';
const QUEUE_NAME = 'firebaseQueue';

export class FirebaseListener {
    static async listen(): Promise<void> {
        try {
            const channel = await connectRabbitMQ();
            await channel.assertExchange(EXCHANGE_NAME, 'topic', {
                durable: true,
            });
            await channel.assertQueue(QUEUE_NAME, { durable: true });

            // Bind the queue to general notification events only
            await channel.bindQueue(
                QUEUE_NAME,
                EXCHANGE_NAME,
                NotificationEventTypes.ORDER_CREATED,
            );
            await channel.bindQueue(
                QUEUE_NAME,
                EXCHANGE_NAME,
                NotificationEventTypes.ORDER_DELIVERED,
            );
            await channel.bindQueue(
                QUEUE_NAME,
                EXCHANGE_NAME,
                NotificationEventTypes.ORDER_UPDATED,
            );

            log.info(
                `Firebase listener is waiting for messages in queue: "${QUEUE_NAME}"`,
            );

            channel.consume(
                QUEUE_NAME,
                async (msg) => {
                    if (msg) {
                        try {
                            const eventData = JSON.parse(
                                msg.content.toString(),
                            );
                            let notificationMessage;

                            switch (msg.fields.routingKey) {
                                case NotificationEventTypes.ORDER_CREATED:
                                    notificationMessage = `Hi, ${eventData.user.name}! Your order #${eventData.orderId} has been placed.`;
                                    break;
                                case NotificationEventTypes.ORDER_DELIVERED:
                                    notificationMessage = `Hi, ${eventData.user.name}! Your order #${eventData.orderId} has been delivered.`;
                                    break;
                                case NotificationEventTypes.ORDER_UPDATED:
                                    notificationMessage = `Hi, ${eventData.user.name}! Check out our latest promotion: ${eventData.promotionText}`;
                                    break;
                                default:
                                    throw new Error(
                                        `Unsupported event: ${msg.fields.routingKey}`,
                                    );
                            }

                            // Send Firebase notification
                            await sendFirebaseNotification(
                                eventData.user.firebaseToken,
                                notificationMessage,
                            );
                            log.info(
                                `Firebase notification sent for event: ${msg.fields.routingKey}`,
                            );
                            channel.ack(msg);
                        } catch (error) {
                            log.error(
                                'Failed to process Firebase notification:',
                                error,
                            );
                            channel.nack(msg, false, false); // Reject the message without requeueing
                        }
                    }
                },
                { noAck: false },
            );
        } catch (error) {
            log.error('Failed to start Firebase listener:', error);
            throw error;
        }
    }
}
