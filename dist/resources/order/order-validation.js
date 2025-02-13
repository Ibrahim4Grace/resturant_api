"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const zod_1 = require("zod");
const orderSchema = zod_1.z.object({
    items: zod_1.z.array(zod_1.z.object({
        menuId: zod_1.z.string(),
        quantity: zod_1.z.number().min(1),
    })),
    address: zod_1.z.string().min(0, 'Delivery address is required'),
    restaurantId: zod_1.z.string(),
});
const orderStatusSchema = zod_1.z.object({
    status: zod_1.z.enum([
        'pending',
        'processing',
        'ready_for_pickup',
        'shipped',
        'delivered',
        'cancelled',
    ]),
});
const assignRiderSchema = zod_1.z.object({
    rider_name: zod_1.z.string().min(1, 'Rider Name is required'),
});
exports.default = {
    orderSchema,
    orderStatusSchema,
    assignRiderSchema,
};
//# sourceMappingURL=order-validation.js.map