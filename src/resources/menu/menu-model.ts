import { Schema, model } from 'mongoose';
import { IMenu } from '../../resources/menu/menu-interface';

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
    },
    { timestamps: true },
);

export default model<IMenu>('Menu', menuSchema);
