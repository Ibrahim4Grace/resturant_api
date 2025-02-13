"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPaginatedAndCachedResults = getPaginatedAndCachedResults;
const index_1 = require("@/utils/index");
async function getPaginatedAndCachedResults(req, res, model, cacheKeyPrefix, filter = {}, projection = {}) {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 6;
    const cacheKey = `${cacheKeyPrefix}_page_${page}_limit_${limit}`;
    // Check for cached data
    const cachedResults = await (0, index_1.getCachedData)(cacheKey);
    if (cachedResults) {
        return cachedResults;
    }
    const totalItems = await model.countDocuments({});
    const totalPages = Math.ceil(totalItems / limit);
    const results = await model
        .find(filter, projection)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean();
    const paginatedResults = {
        results: results,
        currentPage: page,
        totalPages,
        limit,
    };
    // Cache the paginated results
    await (0, index_1.cacheData)(cacheKey, paginatedResults, index_1.CACHE_TTL.FIVE_MINUTES);
    return paginatedResults;
}
//# sourceMappingURL=pagination.js.map