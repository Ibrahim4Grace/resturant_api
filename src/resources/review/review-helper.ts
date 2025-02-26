import { IReview } from './review-interface';

export function reviewData(review: IReview) {
    return {
        _id: review._id,
        userId: review.userId,
        targetType: review.targetType,
        targetId: review.targetId,
        rating: review.rating,
        comment: review.comment,
        createdAt: review.createdAt,
        updatedAt: review.updatedAt,
    };
}
