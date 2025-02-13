"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CACHE_TTL = void 0;
exports.cacheData = cacheData;
exports.getCachedData = getCachedData;
exports.deleteCacheData = deleteCacheData;
exports.withCachedData = withCachedData;
const index_1 = require("@/config/index");
const index_2 = require("@/utils/index");
// Define TTL constants
exports.CACHE_TTL = {
    ONE_MINUTE: 60,
    FIVE_MINUTES: 60,
    ONE_HOUR: 60,
    ONE_DAY: 60,
    // FIVE_MINUTES: 300,
    // ONE_HOUR: 3600,
    // ONE_DAY: 86400,
};
// Generic cache data function
async function cacheData(key, data, expirationInSeconds) {
    try {
        await index_1.redis.set(key, JSON.stringify(data), 'EX', expirationInSeconds);
        index_2.log.info(`Cached data for key: ${key}`);
    }
    catch (error) {
        index_2.log.error(`Error caching data for key ${key}:`, error);
    }
}
// Get cached user data
async function getCachedData(key) {
    try {
        const cachedData = await index_1.redis.get(key);
        if (cachedData) {
            index_2.log.info(`Cache hit for key: ${key}`);
            return JSON.parse(cachedData);
        }
        index_2.log.info(`Cache miss for key: ${key}`);
        return null;
    }
    catch (error) {
        index_2.log.error(`Error getting cached data for key ${key}:`, error);
        return null;
    }
}
// Delete cache
async function deleteCacheData(key) {
    try {
        await index_1.redis.del(key);
        index_2.log.info(`Deleted cache for key: ${key}`);
    }
    catch (error) {
        index_2.log.error(`Error deleting cache for key ${key}:`, error);
    }
}
async function withCachedData(key, fetchData, ttl) {
    const cachedData = await getCachedData(key);
    if (cachedData) {
        return cachedData;
    }
    const data = await fetchData();
    await cacheData(key, data, ttl);
    return data;
}
// public async fetchAdminsById(userId: string): Promise<IAdmin> {
//     const cacheKey = this.CACHE_KEYS.ADMIN_BY_ID(userId);
//     const cachedAdmin = await getCachedData<IAdmin>(cacheKey);
//     if (cachedAdmin) {
//         return cachedAdmin;
//     }
//     const admin = await this.admin.findById(userId);
//     if (!admin) {
//         throw new ResourceNotFound('Admin not found');
//     }
//     await cacheData(cacheKey, admin, CACHE_TTL.ONE_HOUR);
//     return admin;
// }
// public async fetchUserById(userId: string): Promise<IUser> {
//     return withCachedData(
//         this.CACHE_KEYS.USER_BY_ID(userId),
//         async () => {
//             const user = await this.user.findById(userId);
//             if (!user) throw new ResourceNotFound('User not found');
//             return user;
//         },
//         CACHE_TTL.ONE_HOUR
//     );
// }
//# sourceMappingURL=cache.js.map