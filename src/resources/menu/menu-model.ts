import { Schema, model } from "mongoose";
import { Menu } from "@/resources/menu/menu-interface";

const menuSchema = new Schema<Menu>(
    {
        restaurantId: [
            {
                type: Schema.Types.ObjectId,
                ref: "Restaurant",
            },
        ],
        name: String,
        description: String,
        price: Number,
        category: String,
        image: { imageId: String, imageUrl: String },
        customizations: [
            {
                name: String,
                options: [
                    {
                        name: String,
                        price: Number,
                    },
                ],
                required: Boolean,
            },
        ],
        availability: Boolean,
    },
    { timestamps: true },
);

export default model<Menu>("Menu", menuSchema);
