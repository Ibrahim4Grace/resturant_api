"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importStar(require("express"));
const payment_service_1 = require("@/resources/payment/payment-service");
const order_service_1 = require("@/resources/order/order-service");
const user_service_1 = require("@/resources/user/user-service");
const user_model_1 = __importDefault(require("@/resources/user/user-model"));
const payment_validation_1 = __importDefault(require("@/resources/payment/payment-validation"));
const index_1 = require("@/middlewares/index");
class PaymentController {
    constructor() {
        this.path = '/payments';
        this.router = (0, express_1.Router)();
        this.processPayment = (0, index_1.asyncHandler)(async (req, res) => {
            const { orderId, paymentMethod } = req.body;
            const userId = req.currentUser?._id;
            if (!userId) {
                throw new index_1.ResourceNotFound('User not found');
            }
            console.log('Request Body:', req.body);
            const params = {
                userId: userId.toString(),
                orderId,
                paymentMethod,
                userEmail: req.currentUser.email,
            };
            const result = await this.paymentService.processPayment(params);
            return (0, index_1.sendJsonResponse)(res, 200, result.message, result.data);
        });
        this.handleWebhook = (0, index_1.asyncHandler)(async (req, res) => {
            const { event, data } = req.body;
            const signature = req.headers['x-paystack-signature'];
            const success = await this.paymentService.handleWebhookEvent(event, data, signature);
            return res.status(success ? 200 : 400).json({
                success,
                message: success
                    ? 'Webhook processed successfully'
                    : 'Webhook processing failed',
            });
        });
        this.initializeRoutes();
        this.orderService = new order_service_1.OrderService();
        this.userService = new user_service_1.UserService();
        this.paymentService = new payment_service_1.PaymentService(this.orderService, this.userService);
    }
    initializeRoutes() {
        this.router.post(`${this.path}/initialize`, (0, index_1.authMiddleware)(), (0, index_1.authorization)(user_model_1.default, ['user']), (0, index_1.validateData)(payment_validation_1.default.paymentSchema), this.processPayment);
        this.router.post(`${this.path}/webhook`, express_1.default.raw({ type: 'application/json' }), this.handleWebhook);
    }
}
exports.default = PaymentController;
//# sourceMappingURL=payment-controller.js.map