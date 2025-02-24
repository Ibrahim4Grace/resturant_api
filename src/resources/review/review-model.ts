import { Schema, model } from 'mongoose';
import { IReview } from './review-interface';

const reviewSchema = new Schema(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        targetType: {
            type: String,
            enum: ['Restaurant', 'Menu'],
            required: true,
        },
        targetId: {
            type: Schema.Types.ObjectId,
            refPath: 'targetType',
            required: true,
        },
        rating: {
            type: Number,
            required: true,
            min: 1,
            max: 5,
        },
        comment: {
            type: String,
        },
    },
    { timestamps: true },
);

// Create compound index for efficient querying
reviewSchema.index({ targetType: 1, targetId: 1 });
reviewSchema.index({ userId: 1, targetType: 1, targetId: 1 }, { unique: true });

export default model<IReview>('ReviewModel', reviewSchema);
