"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmailQueueService = void 0;
const index_1 = require("@/config/index");
const index_2 = require("@/utils/index");
const QUEUE_NAME = 'emailQueue';
class EmailQueueService {
    // Initialize the email queue
    static async initializeEmailQueue() {
        try {
            const channel = await (0, index_1.connectRabbitMQ)();
            await channel.assertQueue(QUEUE_NAME, { durable: true });
            index_2.log.info(`Queue "${QUEUE_NAME}" is ready`);
        }
        catch (error) {
            index_2.log.error('Failed to initialize email queue:', error);
            throw error;
        }
    }
    // Add email to the RabbitMQ queue
    static async addEmailToQueue(emailOptions) {
        try {
            const channel = await (0, index_1.connectRabbitMQ)();
            channel.sendToQueue(QUEUE_NAME, Buffer.from(JSON.stringify(emailOptions)), { persistent: true });
            index_2.log.info('Email added to queue:', emailOptions);
        }
        catch (error) {
            index_2.log.error('Failed to add email to queue:', error);
            throw error;
        }
    }
    // Consume emails from the queue
    static async consumeEmails() {
        try {
            const channel = await (0, index_1.connectRabbitMQ)();
            await channel.assertQueue(QUEUE_NAME, { durable: true });
            index_2.log.info(`Waiting for messages in queue: "${QUEUE_NAME}"`);
            channel.consume(QUEUE_NAME, async (msg) => {
                if (msg) {
                    try {
                        const emailOptions = JSON.parse(msg.content.toString());
                        // Send the email
                        await (0, index_2.sendMail)(emailOptions);
                        index_2.log.info(`Email sent to ${emailOptions.to}`);
                        channel.ack(msg);
                    }
                    catch (error) {
                        index_2.log.error('Failed to process email:', error);
                        channel.nack(msg, false, false); // Reject the message without requeueing
                    }
                }
            }, { noAck: false });
        }
        catch (error) {
            index_2.log.error('Failed to consume emails:', error);
            throw error;
        }
    }
}
exports.EmailQueueService = EmailQueueService;
//# sourceMappingURL=emailQueue.js.map