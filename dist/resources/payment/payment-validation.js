"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const zod_1 = require("zod");
const paymentSchema = zod_1.z.object({
    orderId: zod_1.z.string().min(1, 'Order Id is required'),
    paymentMethod: zod_1.z.string().min(1, 'Payment method is required'),
});
exports.default = {
    paymentSchema,
};
//# sourceMappingURL=payment-validation.js.map