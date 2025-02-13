"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.redis = void 0;
const ioredis_1 = __importDefault(require("ioredis"));
const index_1 = require("@/utils/index");
// Use the Redis URL in production or fallback to local Redis configuration
exports.redis = process.env.REDIS_URL
    ? new ioredis_1.default(process.env.REDIS_URL) // Production URL
    : new ioredis_1.default({
        host: process.env.REDIS_HOST || '127.0.0.1',
        port: Number(process.env.REDIS_PORT) || 6379,
        password: process.env.REDIS_PASSWORD || undefined,
        retryStrategy: (times) => {
            const delay = Math.min(times * 50, 2000);
            return delay;
        },
        maxRetriesPerRequest: 3,
    });
exports.redis.on('connect', () => {
    index_1.log.info('Connected to Redis');
});
exports.redis.on('error', (err) => {
    index_1.log.error('Redis error:', err);
});
//# sourceMappingURL=redis.js.map