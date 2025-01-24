import mongoose from 'mongoose';
import { log } from '@/utils/index';

export const initializeDatabase = async (): Promise<void> => {
    const { MONGODB_URI } = process.env;

    if (!MONGODB_URI) {
        throw new Error('MongoDB URI is missing!');
    }

    try {
        await mongoose.connect(MONGODB_URI);
        log.info('Database connected successfully');
    } catch (err) {
        log.error('Database connection failed:', err);
        process.exit(1); // Exit the process if the database connection fails
    }
};
