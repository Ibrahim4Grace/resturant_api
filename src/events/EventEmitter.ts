import { connectRabbitMQ } from '../config/index';
import { log } from '../utils/index';

const EXCHANGE_NAME = 'events';

export class EventEmitter {
    static async emit(eventName: string, data: any): Promise<void> {
        try {
            const channel = await connectRabbitMQ();
            await channel.assertExchange(EXCHANGE_NAME, 'topic', {
                durable: true,
            });
            channel.publish(
                EXCHANGE_NAME,
                eventName,
                Buffer.from(JSON.stringify(data)),
                { persistent: true },
            );
            log.info(`Event "${eventName}" emitted with data:`, data);
        } catch (error) {
            log.error('Failed to emit event:', error);
            throw error;
        }
    }
}
