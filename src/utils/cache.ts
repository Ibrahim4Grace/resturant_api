import { redis } from '../config/index';
import { log } from '../utils/index';

// Define TTL constants
export const CACHE_TTL = {
    ONE_MINUTE: 60,
    FIVE_MINUTES: 60,
    ONE_HOUR: 60,
    ONE_DAY: 60,
    FIFTEEN_MINUTES: 60,

    // ONE_MINUTE: 60,
    // FIVE_MINUTES: 300,
    // ONE_HOUR: 3600,
    // ONE_DAY: 86400,
    // FIFTEEN_MINUTES: 900,
} as const;

// Generic cache data function
export async function cacheData<T>(
    key: string,
    data: T,
    expirationInSeconds: number,
): Promise<void> {
    try {
        await redis.set(key, JSON.stringify(data), 'EX', expirationInSeconds);
        log.info(`Cached data for key: ${key}`);
    } catch (error) {
        log.error(`Error caching data for key ${key}:`, error);
    }
}

// Get cached user data
export async function getCachedData<T>(key: string): Promise<T | null> {
    try {
        const cachedData = await redis.get(key);
        if (cachedData) {
            log.info(`Cache hit for key: ${key}`);
            return JSON.parse(cachedData);
        }
        log.info(`Cache miss for key: ${key}`);
        return null;
    } catch (error) {
        log.error(`Error getting cached data for key ${key}:`, error);
        return null;
    }
}

// Delete cache
export async function deleteCacheData(key: string): Promise<void> {
    try {
        await redis.del(key);
        log.info(`Deleted cache for key: ${key}`);
    } catch (error) {
        log.error(`Error deleting cache for key ${key}:`, error);
    }
}

export async function withCachedData<T>(
    key: string,
    fetchData: () => Promise<T>,
    ttl: number,
): Promise<T> {
    const cachedData = await getCachedData<T>(key);
    if (cachedData) {
        return cachedData;
    }

    const data = await fetchData();
    await cacheData(key, data, ttl);
    return data;
}
