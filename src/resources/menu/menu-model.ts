import { Schema, model } from 'mongoose';
import { IMenu } from '../menu/menu-interface';

const menuSchema = new Schema<IMenu>(
    {
        restaurantId: {
            type: Schema.Types.ObjectId,
            ref: 'Restaurant',
            required: true,
        },
        name: String,
        description: String,
        price: Number,
        quantity: Number,
        category: String,
        image: { imageId: String, imageUrl: String },
        availability: Boolean,
        reviewStats: {
            totalReviews: { type: Number, default: 0 },
            averageRating: { type: Number, default: 0 },
        },
    },
    { timestamps: true },
);

// update review statistics
menuSchema.methods.updateReviewStats = async function () {
    if (this.reviews && this.reviews.length > 0) {
        const totalReviews = this.reviews.length;
        const averageRating =
            this.reviews.reduce((acc, review) => acc + review.rating, 0) /
            totalReviews;

        this.reviewStats = {
            totalReviews,
            averageRating: parseFloat(averageRating.toFixed(1)),
        };
        this.rating = this.reviewStats.averageRating;
    }
};

//update stats when reviews are modified
menuSchema.pre('save', async function (next) {
    if (this.isModified('reviews')) {
        await this.updateReviewStats();
    }
    next();
});

menuSchema.index({ restaurantId: 1 });

export default model<IMenu>('Menu', menuSchema);
