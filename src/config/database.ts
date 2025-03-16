import mongoose from 'mongoose';
import { logger } from '../utils/index';

export const initializeDatabase = async (): Promise<void> => {
    const { MONGODB_URI } = process.env;

    if (!MONGODB_URI) {
        throw new Error('MongoDB URI is missing!');
    }

    try {
        await mongoose.connect(MONGODB_URI, {
            maxPoolSize: 50, // Handle 300+ concurrent connections
            minPoolSize: 10, // Keep at least 10 connections open
            connectTimeoutMS: 10000, // Timeout after 10 seconds
            socketTimeoutMS: 45000, // Close socket after 45 seconds of inactivity
        });

        mongoose.connection.on('error', (err) => {
            logger.error('MongoDB connection error:', err);
        });

        mongoose.connection.on('connected', () => {
            logger.info('Connected to MongoDB');
        });

        logger.info('Database connected successfully');
    } catch (err) {
        logger.error('Database connection failed:', err);
        throw err;
    }
};
