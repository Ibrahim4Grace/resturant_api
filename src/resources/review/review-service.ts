import { Types } from 'mongoose';
import { Request, Response } from 'express';
import ReviewModel from './review-model';
import RestaurantModel from '../restaurant/restaurant-model';
import MenuModel from '../menu/menu-model';
import { ResourceNotFound } from '../../middlewares/index';
import { IReview } from './review-interface';
import { IReviewPaginatedResponse } from '../../types/index';
import { reviewData } from '../review/review-helper';
import {
    withCachedData,
    CACHE_TTL,
    deleteCacheData,
    CACHE_KEYS,
    getPaginatedAndCachedResults,
} from '../../utils/index';

export class ReviewService {
    private review = ReviewModel;
    private restaurant = RestaurantModel;
    private menu = MenuModel;
    private reviewData = reviewData;

    public async createReview(reviewData: {
        userId: string;
        targetType: 'restaurant' | 'menu';
        targetId: string;
        rating: number;
        comment?: string;
    }) {
        if (reviewData.targetType === 'restaurant') {
            const restaurant = await this.restaurant.findById(
                reviewData.targetId,
            );
            if (!restaurant) {
                throw new ResourceNotFound('Restaurant not found');
            }
        } else if (reviewData.targetType === 'menu') {
            const menu = await this.menu.findById(reviewData.targetId);
            if (!menu) {
                throw new ResourceNotFound('Menu item not found');
            }
        }

        const review = await this.review.create(reviewData);

        await this.updateReviewStats(
            reviewData.targetType,
            reviewData.targetId,
        );

        return this.reviewData(review);
    }

    public async updateReview(
        reviewId: string,
        userId: string,
        updateData: { rating?: number; comment?: string },
    ) {
        const review = await this.review.findOne({ _id: reviewId, userId });
        if (!review) {
            throw new ResourceNotFound('Review not found');
        }

        if (updateData.rating) review.rating = updateData.rating;
        if (updateData.comment !== undefined)
            review.comment = updateData.comment;
        await review.save();

        await this.updateReviewStats(
            review.targetType,
            review.targetId.toString(),
        );

        return this.reviewData(review);
    }

    public async deleteReview(reviewId: string, userId: string) {
        const review = await this.review.findOne({ _id: reviewId, userId });
        if (!review) {
            throw new ResourceNotFound('Review not found');
        }

        const { targetType, targetId } = review;
        await review.deleteOne();

        await this.updateReviewStats(targetType, targetId.toString());

        return { success: true };
    }

    public async getReviewsForTarget(
        targetType: 'restaurant' | 'menu',
        targetId: string,
    ) {
        const cacheKey = CACHE_KEYS.TARGET_REVIEWS(targetType, targetId);
        return withCachedData(
            cacheKey,
            async () => {
                const reviews = await this.review.find({
                    targetType,
                    targetId,
                });

                return reviews.map((review) => this.reviewData(review));
            },
            CACHE_TTL.FIVE_MINUTES,
        );
    }

    private async updateReviewStats(
        targetType: 'restaurant' | 'menu',
        targetId: string,
    ) {
        // Calculate new stats
        const stats = await this.review.aggregate([
            { $match: { targetType, targetId: new Types.ObjectId(targetId) } },
            {
                $group: {
                    _id: null,
                    totalReviews: { $sum: 1 },
                    averageRating: { $avg: '$rating' },
                },
            },
        ]);

        const newStats =
            stats.length > 0
                ? {
                      totalReviews: stats[0].totalReviews,
                      averageRating: parseFloat(
                          stats[0].averageRating.toFixed(1),
                      ),
                  }
                : { totalReviews: 0, averageRating: 0 };

        // Update the target entity
        if (targetType === 'restaurant') {
            await this.restaurant.updateOne(
                { _id: targetId },
                { $set: { reviewStats: newStats } },
            );
        } else if (targetType === 'menu') {
            await this.menu.updateOne(
                { _id: targetId },
                { $set: { reviewStats: newStats } },
            );
        }

        // Invalidate restaurant-related caches
        await deleteCacheData(CACHE_KEYS.RESTAURANT_DETAILS(targetId));
        await deleteCacheData(CACHE_KEYS.RESTAURANT_ANALYTICS(targetId));
        await deleteCacheData(
            CACHE_KEYS.TARGET_REVIEWS('Restaurant', targetId),
        );
    }

    public async getReviews(
        req: Request,
        res: Response,
    ): Promise<IReviewPaginatedResponse> {
        const paginatedResults = await getPaginatedAndCachedResults<IReview>(
            req,
            res,
            this.review,
            CACHE_KEYS.ALL_REVIEWS,
        );

        return {
            results: paginatedResults.results.map((review) =>
                this.reviewData(review),
            ) as IReview[],
            pagination: {
                currentPage: paginatedResults.currentPage,
                totalPages: paginatedResults.totalPages,
                limit: paginatedResults.limit,
            },
        };
    }
}
