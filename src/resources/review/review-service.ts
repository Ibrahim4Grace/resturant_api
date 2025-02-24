import { Types } from 'mongoose';
import ReviewModel from './review-model';
import RestaurantModel from '../restaurant/model';
import MenuModel from '../menu/menu-model';
import { ResourceNotFound } from '../../middlewares/index';
import { withCachedData, CACHE_TTL } from '../../utils/index';

export class ReviewService {
    private review = ReviewModel;
    private restaurant = RestaurantModel;
    private menu = MenuModel;
    private readonly CACHE_KEYS = {
        TARGET_REVIEWS: (targetType: string, targetId: string) =>
            `rider:${targetType}:${targetId}`,
    };

    public async createReview(reviewData: {
        userId: string;
        targetType: 'Restaurant' | 'Menu';
        targetId: string;
        rating: number;
        comment?: string;
    }) {
        if (reviewData.targetType === 'Restaurant') {
            const restaurant = await this.restaurant.findById(
                reviewData.targetId,
            );
            if (!restaurant) {
                throw new ResourceNotFound('Restaurant not found');
            }
        } else if (reviewData.targetType === 'Menu') {
            const menu = await this.menu.findById(reviewData.targetId);
            if (!menu) {
                throw new ResourceNotFound('Menu item not found');
            }
        }

        const review = await this.review.create(reviewData);

        // Update stats for the target
        await this.updateReviewStats(
            reviewData.targetType,
            reviewData.targetId,
        );

        return review;
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

        return review;
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
        targetType: 'Restaurant' | 'Menu',
        targetId: string,
    ) {
        const cacheKey = this.CACHE_KEYS.TARGET_REVIEWS(targetType, targetId);
        return withCachedData(
            cacheKey,
            async () => {
                const reviews = await this.review
                    .find({ targetType, targetId })
                    .populate('userId', 'name avatar')
                    .sort({ createdAt: -1 });

                return reviews;
            },
            CACHE_TTL.FIVE_MINUTES,
        );
    }

    private async updateReviewStats(
        targetType: 'Restaurant' | 'Menu',
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
        if (targetType === 'Restaurant') {
            await this.restaurant.updateOne(
                { _id: targetId },
                { $set: { reviewStats: newStats } },
            );
        } else if (targetType === 'Menu') {
            await this.menu.updateOne(
                { _id: targetId },
                { $set: { reviewStats: newStats } },
            );
        }

        // Invalidate related cache
        // Your cache invalidation logic here
    }

    // Get a user's reviews
    public async getUserReviews(userId: string) {
        return this.review
            .find({ userId })
            .select('__v')
            .sort({ createdAt: -1 })
            .populate('targetId');
    }
}
