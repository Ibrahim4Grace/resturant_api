"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const paymentSchema = new mongoose_1.Schema({
    orderId: {
        type: String,
        required: true,
        ref: 'Order',
    },
    userId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    amount: {
        type: Number,
        required: true,
    },
    status: {
        type: String,
        enum: ['processing', 'completed', 'failed'],
        default: 'processing',
    },
    paymentMethod: {
        type: String,
        enum: ['paystack', 'cash_on_delivery'],
        required: true,
    },
    transactionDetails: {
        reference: String,
        authorizationUrl: String,
        metadata: mongoose_1.Schema.Types.Mixed,
    },
}, { timestamps: true });
exports.default = (0, mongoose_1.model)('Payment', paymentSchema);
//# sourceMappingURL=payment-model.js.map