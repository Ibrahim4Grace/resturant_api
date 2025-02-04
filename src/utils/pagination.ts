import { Request, Response } from 'express';
import { Model, Document } from 'mongoose';
import { IPaginationResponse } from '@/types/index';
import { CACHE_TTL, cacheData, getCachedData } from '@/utils/index';

export async function getPaginatedAndCachedResults<T extends Document>(
    req: Request,
    res: Response,
    model: Model<T>,
    cacheKeyPrefix: string,
    filter: Record<string, any> = {},
    projection: Record<string, 1 | 0> = {},
): Promise<{ results: T[] } & IPaginationResponse> {
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 6;
    const cacheKey = `${cacheKeyPrefix}_page_${page}_limit_${limit}`;

    // Check for cached data
    const cachedResults = await getCachedData<
        { results: T[] } & IPaginationResponse
    >(cacheKey);
    if (cachedResults) {
        return cachedResults;
    }

    // Ensure `res.paginatedResults` exists
    const totalItems = await model.countDocuments({});
    const totalPages = Math.ceil(totalItems / limit);

    const results = await model
        .find(filter, projection)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean();

    const paginatedResults = {
        results: results as T[],
        currentPage: page,
        totalPages,
        limit,
    };

    // Cache the paginated results
    await cacheData(cacheKey, paginatedResults, CACHE_TTL.FIVE_MINUTES);

    return paginatedResults;
}
