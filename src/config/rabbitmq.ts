import amqplib, { Connection, Channel } from 'amqplib';
import { log } from '../utils';

let connection: Connection;
let channel: Channel;

export const connectRabbitMQ = async (): Promise<Channel> => {
    if (connection && channel) {
        return channel; // Reuse existing connection and channel
    }

    try {
        connection = await amqplib.connect(
            process.env.RABBITMQ_URL || 'amqp://localhost',
        );
        channel = await connection.createChannel();
        log.info('RabbitMQ connected');
        return channel;
    } catch (error) {
        log.error('Failed to connect to RabbitMQ:', error);
        process.exit(1);
    }
};

export const closeRabbitMQ = async (): Promise<void> => {
    try {
        if (channel) await channel.close();
        if (connection) await connection.close();
        log.info('RabbitMQ connection closed');
    } catch (error) {
        log.error('Failed to close RabbitMQ connection:', error);
    }
};
