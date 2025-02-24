import { Types } from 'mongoose';

export interface IReview {
    userId: Types.ObjectId;
    targetType: 'Restaurant' | 'Menu';
    targetId: Types.ObjectId;
    rating: number;
    comment?: string;
    createdAt: Date;
    updatedAt: Date;
}
