import amqplib, { Connection, Channel } from 'amqplib';
// import { log } from '../utils/index';
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
        console.info('RabbitMQ connected');
        return channel;
    } catch (error) {
        console.error('Failed to connect to RabbitMQ:', error);
        process.exit(1);
    }
};

export const closeRabbitMQ = async (): Promise<void> => {
    try {
        if (channel) await channel.close();
        if (connection) await connection.close();
        console.info('RabbitMQ connection closed');
    } catch (error) {
        console.error('Failed to close RabbitMQ connection:', error);
    }
};
