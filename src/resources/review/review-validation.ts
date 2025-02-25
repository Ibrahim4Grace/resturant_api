import { z } from 'zod';

const reviewSchema = z.object({
    targetType: z.string().toLowerCase().min(1, 'targetType is required'),
    targetId: z.string().min(1, 'targetId is required'),
    rating: z.number().min(1, 'rating is required'),
    comment: z.string().min(1, 'comment is required'),
});

const updateReview = z.object({
    rating: z.number().min(1, 'rating is required'),
    comment: z.string().min(1, 'comment is required'),
});

export default {
    reviewSchema,
    updateReview,
};
