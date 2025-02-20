import { connectRabbitMQ } from '../config/index';
import { sendMail, log } from '../utils/index';
import { EmailData } from '../types/index';

const QUEUE_NAME = 'emailQueue';

export class EmailQueueService {
    // Initialize the email queue
    static async initializeEmailQueue(): Promise<void> {
        try {
            const channel = await connectRabbitMQ();
            await channel.assertQueue(QUEUE_NAME, { durable: true });
            log.info(`Queue "${QUEUE_NAME}" is ready`);
        } catch (error) {
            log.error('Failed to initialize email queue:', error);
            throw error;
        }
    }

    // Add email to the RabbitMQ queue
    static async addEmailToQueue(emailOptions: EmailData): Promise<void> {
        try {
            const channel = await connectRabbitMQ();
            channel.sendToQueue(
                QUEUE_NAME,
                Buffer.from(JSON.stringify(emailOptions)),
                { persistent: true },
            );
            log.info('Email added to queue:', emailOptions);
        } catch (error) {
            log.error('Failed to add email to queue:', error);
            throw error;
        }
    }

    // Consume emails from the queue
    static async consumeEmails(): Promise<void> {
        try {
            const channel = await connectRabbitMQ();
            await channel.assertQueue(QUEUE_NAME, { durable: true });

            log.info(`Waiting for messages in queue: "${QUEUE_NAME}"`);

            channel.consume(
                QUEUE_NAME,
                async (msg) => {
                    if (msg) {
                        try {
                            const emailOptions: EmailData = JSON.parse(
                                msg.content.toString(),
                            );

                            // Send the email
                            await sendMail(emailOptions);
                            log.info(`Email sent to ${emailOptions.to}`);
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
            log.error('Failed to consume emails:', error);
            throw error;
        }
    }
}
