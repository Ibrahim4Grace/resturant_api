import amqplib, { Connection, Channel } from 'amqplib';
import { logger } from '../utils/index';
import { config } from '../config/index';

let connection: Connection;
let channel: Channel;

export const connectRabbitMQ = async (): Promise<Channel> => {
    if (connection && channel) {
        return channel;
    }

    try {
        connection = await amqplib.connect(
            config.RABBITMQ_URL || 'amqp://localhost',
        );
        channel = await connection.createChannel();
        logger.info('RabbitMQ connected');
        return channel;
    } catch (error) {
        logger.error('Failed to connect to RabbitMQ:', error);
        return null;
    }
};

export const closeRabbitMQ = async (): Promise<void> => {
    try {
        if (channel) await channel.close();
        if (connection) await connection.close();
        logger.info('RabbitMQ connection closed');
    } catch (error) {
        logger.error('Failed to close RabbitMQ connection:', error);
    }
};
