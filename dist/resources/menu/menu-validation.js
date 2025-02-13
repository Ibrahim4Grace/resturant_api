"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const zod_1 = require("zod");
const addMenuItemSchema = zod_1.z.object({
    name: zod_1.z.string().min(1, 'Name is required'),
    description: zod_1.z.string().max(100),
    price: zod_1.z.string().min(0, 'Price must be a positive number'),
    quantity: zod_1.z.string().min(0, 'Quantity must be a positive number'),
    category: zod_1.z.string().optional(),
    image: zod_1.z
        .object({
        imageId: zod_1.z.string().optional(),
        imageUrl: zod_1.z.string().optional(),
    })
        .optional(),
});
exports.default = { addMenuItemSchema };
//# sourceMappingURL=menu-validation.js.map