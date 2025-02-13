"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.closeRabbitMQ = exports.connectRabbitMQ = void 0;
const amqplib_1 = __importDefault(require("amqplib"));
const index_1 = require("@/utils/index");
const index_2 = require("@/config/index");
let connection;
let channel;
const connectRabbitMQ = async () => {
    if (connection && channel) {
        return channel;
    }
    try {
        connection = await amqplib_1.default.connect(index_2.config.RABBITMQ_URL || 'amqp://localhost');
        channel = await connection.createChannel();
        index_1.log.info('RabbitMQ connected');
        return channel;
    }
    catch (error) {
        index_1.log.error('Failed to connect to RabbitMQ:', error);
        process.exit(1);
    }
};
exports.connectRabbitMQ = connectRabbitMQ;
const closeRabbitMQ = async () => {
    try {
        if (channel)
            await channel.close();
        if (connection)
            await connection.close();
        index_1.log.info('RabbitMQ connection closed');
    }
    catch (error) {
        index_1.log.error('Failed to close RabbitMQ connection:', error);
    }
};
exports.closeRabbitMQ = closeRabbitMQ;
//# sourceMappingURL=rabbitmq.js.map