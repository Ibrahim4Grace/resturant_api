import { Router, Request, Response } from 'express';
import { Controller } from '../../types/index';
import validate from '../../resources/order/order-validation';
import { OrderService } from '../../resources/order/order-service';
import UserModel from '../../resources/user/user-model';
import RestaurantModel from '../../resources/restaurant/model';
import {
    validateData,
    sendJsonResponse,
    asyncHandler,
    ResourceNotFound,
    authMiddleware,
    authorization,
} from '../../middlewares/index';

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
            authMiddleware(),
            authorization(UserModel, ['user']),
            validateData(validate.orderSchema),
            this.placeOrder,
        );
        this.router.patch(
            `${this.path}/:id/status`,
            authMiddleware(),
            authorization(RestaurantModel, ['restaurant_owner']),
            validateData(validate.orderStatusSchema),
            this.updateOrderStatus,
        );
        this.router.delete(
            `${this.path}/:id`,
            authMiddleware(),
            authorization(RestaurantModel, ['restaurant_owner']),
            this.cancelOrder,
        );
        this.router.patch(
            `${this.path}/:id/assign-rider`,
            authMiddleware(),
            authorization(RestaurantModel, ['restaurant_owner']),
            validateData(validate.assignRiderSchema),
            this.assignRiderToOrder,
        );
        this.router.get(
            `${this.path}/:id`,
            authMiddleware(),
            authorization(RestaurantModel, ['restaurant_owner']),
            this.getOrderById,
        );

        this.router.get(
            `${this.path}`,
            authMiddleware(),
            authorization(RestaurantModel, ['restaurant_owner']),
            this.getUsersOrders,
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

    private updateOrderStatus = asyncHandler(
        async (req: Request, res: Response) => {
            const orderId = req.params.id;
            const restaurantId = req.currentUser?._id;
            if (!restaurantId) {
                throw new ResourceNotFound('Restaurant owner not found');
            }
            const { status } = req.body;
            const order = await this.orderService.updateOrderStatus({
                restaurantId,
                orderId,
                status,
            });
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
        const restaurantId = req.currentUser?._id;
        if (!restaurantId) {
            throw new ResourceNotFound('Restaurant owner not found');
        }
        const order = await this.orderService.cancelOrder({
            orderId,
            restaurantId,
        });
        sendJsonResponse(res, 200, 'Order cancelled successfully', order);
    });

    private assignRiderToOrder = asyncHandler(
        async (req: Request, res: Response) => {
            const orderId = req.params.id;
            const { rider_name } = req.body;
            const restaurantId = req.currentUser?._id;
            if (!restaurantId) {
                throw new ResourceNotFound('Restaurant owner not found');
            }
            const order = await this.orderService.assignRiderToOrder({
                orderId,
                rider_name,
                restaurantId,
            });
            sendJsonResponse(res, 200, 'Rider assigned successfully', order);
        },
    );

    private getOrderById = asyncHandler(async (req: Request, res: Response) => {
        const orderId = req.params.id;
        const restaurantId = req.currentUser?._id;
        if (!restaurantId) {
            throw new ResourceNotFound('Restaurant owner not found');
        }
        const order = await this.orderService.getOrderById({
            orderId,
            restaurantId,
        });
        sendJsonResponse(res, 200, 'Order retrieved successfully', order);
    });

    private getUsersOrders = asyncHandler(
        async (req: Request, res: Response) => {
            const restaurantId = req.currentUser?._id;
            if (!restaurantId) {
                throw new ResourceNotFound('Restaurant owner not found');
            }

            const orders = await this.orderService.fecthUserOrders(
                req,
                res,
                restaurantId,
            );

            sendJsonResponse(
                res,
                200,
                'User orders retrieved successfully',
                orders,
            );
        },
    );
}
