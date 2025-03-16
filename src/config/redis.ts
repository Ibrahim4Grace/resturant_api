import Redis from 'ioredis';
import { logger } from '../utils/index';

// Use the Redis URL in production or fallback to local Redis configuration
export const redis = process.env.REDIS_URL
    ? new Redis(process.env.REDIS_URL) 
    : new Redis({
          host: process.env.REDIS_HOST || '127.0.0.1',
          port: Number(process.env.REDIS_PORT) || 6379,
          password: process.env.REDIS_PASSWORD || undefined,
          retryStrategy: (times: number) => {
              const delay = Math.min(times * 50, 2000);
              return delay;
          },
          maxRetriesPerRequest: 3,
      });

redis.on('connect', () => {
    logger.info('Connected to Redis');
});

redis.on('error', (err) => {
    logger.error('Redis error:', err);
});
