"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const order_validation_1 = __importDefault(require("@/resources/order/order-validation"));
const order_service_1 = require("@/resources/order/order-service");
const user_model_1 = __importDefault(require("@/resources/user/user-model"));
const model_1 = __importDefault(require("@/resources/restaurant/model"));
const index_1 = require("@/middlewares/index");
class OrderController {
    constructor() {
        this.path = '/orders';
        this.router = (0, express_1.Router)();
        this.orderService = new order_service_1.OrderService();
        this.placeOrder = (0, index_1.asyncHandler)(async (req, res) => {
            const userId = req.currentUser?._id;
            if (!userId) {
                throw new index_1.ResourceNotFound('User not found');
            }
            const orderData = req.body;
            const order = await this.orderService.placeOrder(userId, orderData);
            (0, index_1.sendJsonResponse)(res, 201, 'Order placed successfully', order);
        });
        this.updateOrderStatus = (0, index_1.asyncHandler)(async (req, res) => {
            const orderId = req.params.id;
            const restaurantId = req.currentUser?._id;
            if (!restaurantId) {
                throw new index_1.ResourceNotFound('Restaurant owner not found');
            }
            const { status } = req.body;
            const order = await this.orderService.updateOrderStatus({
                restaurantId,
                orderId,
                status,
            });
            (0, index_1.sendJsonResponse)(res, 200, 'Order status updated successfully', order);
        });
        this.cancelOrder = (0, index_1.asyncHandler)(async (req, res) => {
            const orderId = req.params.id;
            const restaurantId = req.currentUser?._id;
            if (!restaurantId) {
                throw new index_1.ResourceNotFound('Restaurant owner not found');
            }
            const order = await this.orderService.cancelOrder({
                orderId,
                restaurantId,
            });
            (0, index_1.sendJsonResponse)(res, 200, 'Order cancelled successfully', order);
        });
        this.assignRiderToOrder = (0, index_1.asyncHandler)(async (req, res) => {
            const orderId = req.params.id;
            const { rider_name } = req.body;
            const restaurantId = req.currentUser?._id;
            if (!restaurantId) {
                throw new index_1.ResourceNotFound('Restaurant owner not found');
            }
            const order = await this.orderService.assignRiderToOrder({
                orderId,
                rider_name,
                restaurantId,
            });
            (0, index_1.sendJsonResponse)(res, 200, 'Rider assigned successfully', order);
        });
        this.getOrderById = (0, index_1.asyncHandler)(async (req, res) => {
            const orderId = req.params.id;
            const restaurantId = req.currentUser?._id;
            if (!restaurantId) {
                throw new index_1.ResourceNotFound('Restaurant owner not found');
            }
            const order = await this.orderService.getOrderById({
                orderId,
                restaurantId,
            });
            (0, index_1.sendJsonResponse)(res, 200, 'Order retrieved successfully', order);
        });
        this.getUsersOrders = (0, index_1.asyncHandler)(async (req, res) => {
            const restaurantId = req.currentUser?._id;
            if (!restaurantId) {
                throw new index_1.ResourceNotFound('Restaurant owner not found');
            }
            const orders = await this.orderService.fecthUserOrders(req, res, restaurantId);
            (0, index_1.sendJsonResponse)(res, 200, 'User orders retrieved successfully', orders);
        });
        this.initializeRoutes();
    }
    initializeRoutes() {
        this.router.post(`${this.path}`, (0, index_1.authMiddleware)(), (0, index_1.authorization)(user_model_1.default, ['user']), (0, index_1.validateData)(order_validation_1.default.orderSchema), this.placeOrder);
        this.router.patch(`${this.path}/:id/status`, (0, index_1.authMiddleware)(), (0, index_1.authorization)(model_1.default, ['restaurant_owner']), (0, index_1.validateData)(order_validation_1.default.orderStatusSchema), this.updateOrderStatus);
        this.router.delete(`${this.path}/:id`, (0, index_1.authMiddleware)(), (0, index_1.authorization)(model_1.default, ['restaurant_owner']), this.cancelOrder);
        this.router.patch(`${this.path}/:id/assign-rider`, (0, index_1.authMiddleware)(), (0, index_1.authorization)(model_1.default, ['restaurant_owner']), (0, index_1.validateData)(order_validation_1.default.assignRiderSchema), this.assignRiderToOrder);
        this.router.get(`${this.path}/:id`, (0, index_1.authMiddleware)(), (0, index_1.authorization)(model_1.default, ['restaurant_owner']), this.getOrderById);
        this.router.get(`${this.path}`, (0, index_1.authMiddleware)(), (0, index_1.authorization)(model_1.default, ['restaurant_owner']), this.getUsersOrders);
    }
}
exports.default = OrderController;
//# sourceMappingURL=order-controller.js.map