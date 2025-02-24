import { connectRabbitMQ } from '../config/index';
import { sendMail, log } from '../utils/index';
import { NotificationEventTypes } from '../events/index';
import {
    sendOTPByEmail,
    welcomeEmail,
    PasswordResetEmail,
    newAddressAdded,
} from '../resources/user/user-email-template';

const EXCHANGE_NAME = 'events';
const QUEUE_NAME = 'emailQueue';

export class EmailListener {
    static async listen(): Promise<void> {
        try {
            const channel = await connectRabbitMQ();
            await channel.assertExchange(EXCHANGE_NAME, 'topic', {
                durable: true,
            });
            await channel.assertQueue(QUEUE_NAME, { durable: true });

            // Bind the queue to specific events
            await channel.bindQueue(
                QUEUE_NAME,
                EXCHANGE_NAME,
                NotificationEventTypes.USER_REGISTERED,
            );
            await channel.bindQueue(
                QUEUE_NAME,
                EXCHANGE_NAME,
                NotificationEventTypes.EMAIL_VERIFIED,
            );
            await channel.bindQueue(
                QUEUE_NAME,
                EXCHANGE_NAME,
                NotificationEventTypes.FORGET_PASSWORD,
            );
            await channel.bindQueue(
                QUEUE_NAME,
                EXCHANGE_NAME,
                NotificationEventTypes.PASSWORD_RESET,
            );

            log.info(
                `Email listener is waiting for messages in queue: "${QUEUE_NAME}"`,
            );

            channel.consume(
                QUEUE_NAME,
                async (msg) => {
                    if (msg) {
                        try {
                            const eventData = JSON.parse(
                                msg.content.toString(),
                            );
                            let emailOptions;

                            switch (msg.fields.routingKey) {
                                case NotificationEventTypes.USER_REGISTERED:
                                    emailOptions = sendOTPByEmail(
                                        eventData.user,
                                        eventData.otp,
                                    );
                                    break;
                                case NotificationEventTypes.EMAIL_VERIFIED:
                                    emailOptions = welcomeEmail(eventData.user);
                                    break;
                                case NotificationEventTypes.FORGET_PASSWORD:
                                    emailOptions = sendOTPByEmail(
                                        eventData.user,
                                        eventData.otp,
                                    );
                                    break;
                                case NotificationEventTypes.PASSWORD_RESET:
                                    emailOptions = PasswordResetEmail(
                                        eventData.user,
                                    );
                                    break;
                                default:
                                    throw new Error(
                                        `Unsupported event: ${msg.fields.routingKey}`,
                                    );
                            }

                            // Send the email
                            await sendMail(emailOptions);
                            log.info(
                                `Email sent for event: ${msg.fields.routingKey}`,
                            );
                            channel.ack(msg);
                        } catch (error) {
                            log.error('Failed to process email:', error);
                            channel.nack(msg, false, false); // Reject the message without requeueing
                        }
                    }
                },
                { noAck: false },
            );
        } catch (error) {
            log.error('Failed to start email listener:', error);
            throw error;
        }
    }
}
