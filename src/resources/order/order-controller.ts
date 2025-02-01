import { Router, Request, Response, NextFunction } from 'express';
import { Controller } from '@/types/index';
import validate from '@/resources/order/order-validation';
import { OrderService } from '@/resources/order/order-service';
import UserModel from '@/resources/user/user-model';
import {
    validateData,
    sendJsonResponse,
    asyncHandler,
    ResourceNotFound,
    BadRequest,
    authMiddleware,
    getCurrentUser,
} from '@/middlewares/index';

export default class OrderController implements Controller {
    public path = '/orders';
    public router = Router();
    private orderService = new OrderService();

    constructor() {
        this.initializeRoutes();
    }

    private initializeRoutes(): void {
        this.router.post(
            `${this.path}`,
            authMiddleware(['user']),
            getCurrentUser(UserModel),
            validateData(validate.orderSchema),
            this.placeOrder,
        );
        this.router.get(
            `${this.path}`,
            authMiddleware(['user']),
            getCurrentUser(UserModel),
            this.getUserOrders,
        );
        this.router.get(
            `${this.path}/:id`,
            authMiddleware(['user', 'admin']),
            getCurrentUser(UserModel),
            this.getOrderById,
        );
        this.router.patch(
            `${this.path}/:id/status`,
            authMiddleware(['admin']),
            validateData(validate.orderStatusSchema),
            this.updateOrderStatus,
        );
        this.router.delete(
            `${this.path}/:id`,
            authMiddleware(['user']),
            getCurrentUser(UserModel),
            this.cancelOrder,
        );
        this.router.get(
            `${this.path}/restaurant/:restaurantId`,
            authMiddleware(['admin']),
            this.getOrdersByRestaurant,
        );
        this.router.patch(
            `${this.path}/:id/assign-rider`,
            authMiddleware(['admin']),
            validateData(validate.assignRiderSchema),
            this.assignRiderToOrder,
        );
    }

    private placeOrder = asyncHandler(async (req: Request, res: Response) => {
        const userId = req.currentUser?._id;
        if (!userId) {
            throw new ResourceNotFound('User not found');
        }

        const orderData = req.body;
        const order = await this.orderService.placeOrder(userId, orderData);

        sendJsonResponse(res, 201, 'Order placed successfully', order);
    });

    private getUserOrders = asyncHandler(
        async (req: Request, res: Response) => {
            const userId = req.currentUser?._id;
            if (!userId) {
                throw new ResourceNotFound('User not found');
            }

            const orders = await this.orderService.getUserOrders(userId);

            sendJsonResponse(
                res,
                200,
                'User orders retrieved successfully',
                orders,
            );
        },
    );

    private getOrderById = asyncHandler(async (req: Request, res: Response) => {
        const orderId = req.params.id;
        const order = await this.orderService.getOrderById(orderId);
        sendJsonResponse(res, 200, 'Order retrieved successfully', order);
    });

    private updateOrderStatus = asyncHandler(
        async (req: Request, res: Response) => {
            const orderId = req.params.id;
            const { status } = req.body;
            const order = await this.orderService.updateOrderStatus(
                orderId,
                status,
            );
            sendJsonResponse(
                res,
                200,
                'Order status updated successfully',
                order,
            );
        },
    );

    private cancelOrder = asyncHandler(async (req: Request, res: Response) => {
        const orderId = req.params.id;
        const order = await this.orderService.cancelOrder(orderId);
        sendJsonResponse(res, 200, 'Order cancelled successfully', order);
    });

    private getOrdersByRestaurant = asyncHandler(
        async (req: Request, res: Response) => {
            const restaurantId = req.params.restaurantId;
            const orders =
                await this.orderService.getOrdersByRestaurant(restaurantId);
            sendJsonResponse(res, 200, 'Orders retrieved successfully', orders);
        },
    );

    private assignRiderToOrder = asyncHandler(
        async (req: Request, res: Response) => {
            const orderId = req.params.id;
            const { riderId } = req.body;
            const order = await this.orderService.assignRiderToOrder(
                orderId,
                riderId,
            );
            sendJsonResponse(res, 200, 'Rider assigned successfully', order);
        },
    );
}
