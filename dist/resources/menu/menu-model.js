"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const menuSchema = new mongoose_1.Schema({
    restaurantId: {
        type: mongoose_1.Schema.Types.ObjectId,
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
}, { timestamps: true });
exports.default = (0, mongoose_1.model)('Menu', menuSchema);
//# sourceMappingURL=menu-model.js.map