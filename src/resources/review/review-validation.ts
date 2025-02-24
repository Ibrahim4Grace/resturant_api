import { z } from 'zod';

const reviewSchema = z.object({
    targetType: z.string().min(1, 'targetType is required'),
    targetId: z.string().email().trim().min(1, 'targetId is required'),
    rating: z.string().min(1, 'rating is required'),
    comment: z.string().min(1, 'comment is required'),
});

const updateReview = z.object({
    rating: z.string().min(1, 'targetType is required'),
    comment: z.string().email().trim().min(1, 'targetId is required'),
});

export default {
    reviewSchema,
    updateReview,
};
