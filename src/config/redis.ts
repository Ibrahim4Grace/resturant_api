import Redis from 'ioredis';
import { log } from '@/utils/index';

// Use the Redis URL in production or fallback to local Redis configuration
export const redis = process.env.REDIS_URL
    ? new Redis(process.env.REDIS_URL) // Production URL
    : new Redis({
          host: process.env.REDIS_HOST,
          port: Number(process.env.REDIS_PORT),
          password: process.env.REDIS_PASSWORD,
          retryStrategy: (times: number) => {
              const delay = Math.min(times * 50, 2000);
              return delay;
          },
          maxRetriesPerRequest: 3,
      });

redis.on('connect', () => {
    log.info('Connected to Redis');
});

redis.on('error', (err) => {
    log.error('Redis error:', err);
});
