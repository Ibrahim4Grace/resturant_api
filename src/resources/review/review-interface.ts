import { Types, Document } from 'mongoose';

export interface IReview extends Document {
    _id: string;
    userId: Types.ObjectId;
    targetType: 'restaurant' | 'menu';
    targetId: Types.ObjectId;
    rating: number;
    comment?: string;
    createdAt: Date;
    updatedAt: Date;
}
