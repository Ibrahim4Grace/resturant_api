import { Router, Request, Response } from 'express';
import { Controller } from '../../types';
import { OrderQueueService } from '../../queue';
import validate from '../order/order-validation';
import { OrderService } from '../order/order-service';
import UserModel from '../user/user-model';
import RestaurantModel from '../restaurant/restaurant-model';
import { PaymentService } from '../gateway/payment-service';
import { WalletService } from '../wallet/wallet-service';
import { UserService } from '../user/user-service';
import {
    validateData,
    sendJsonResponse,
    asyncHandler,
    ResourceNotFound,
    authAndAuthorize,
} from '../../middlewares';

export default class OrderController implements Controller {
    public path = '/order';
    public router = Router();
    private orderService: OrderService;
    private paymentService: PaymentService;
    private userService: UserService;
    private walletService: WalletService;

    constructor() {
        this.initializeRoutes();
        this.orderService = new OrderService(this.paymentService);
        this.paymentService = new PaymentService(
            this.orderService,
            this.userService,
            this.walletService,
        );
    }

    private initializeRoutes(): void {
        this.router.post(
            `${this.path}`,
            ...authAndAuthorize(UserModel, ['user']),
            validateData(validate.orderSchema),
            this.createOrder,
        );
        this.router.post(
            `${this.path}/:orderId/confirm-delivery`,
            ...authAndAuthorize(UserModel, ['user']),
            this.confirmDelivery,
        );
        this.router.patch(
            `${this.path}/:id/status`,
            ...authAndAuthorize(RestaurantModel, ['restaurant_owner']),
            validateData(validate.orderStatusSchema),
            this.updateOrderStatus,
        );
        this.router.delete(
            `${this.path}/:id`,
            ...authAndAuthorize(RestaurantModel, ['restaurant_owner']),
            this.cancelOrder,
        );

        this.router.get(
            `${this.path}/:id`,
            ...authAndAuthorize(RestaurantModel, ['restaurant_owner']),
            this.getOrderById,
        );

        this.router.get(
            `${this.path}`,
            ...authAndAuthorize(RestaurantModel, ['restaurant_owner']),
            this.getUsersOrders,
        );
    }

    private createOrder = asyncHandler(async (req: Request, res: Response) => {
        const userId = req.currentUser._id;
        const userEmail = req.currentUser.email;
        if (!userId) throw new ResourceNotFound('User not found');

        const orderData = req.body;
        await OrderQueueService.addOrderToQueue(orderData);
        sendJsonResponse(res, 202, 'Order received, processing soon', {
            tempId: `TEMP-${Date.now()}`,
        });

        // const order = await this.orderService.placeOrder(userId, orderData);
        // sendJsonResponse(res, 201, 'Order placed successfully', order);
    });

    private confirmDelivery = asyncHandler(
        async (req: Request, res: Response) => {
            const { orderId } = req.params;
            const userId = req.currentUser._id;
            if (!userId) throw new ResourceNotFound('User not found');

            const order = await this.orderService.confirmDelivery({
                orderId,
                userId,
            });
            sendJsonResponse(
                res,
                200,
                'Delivery confirmed successfully',
                order,
            );
        },
    );

    private updateOrderStatus = asyncHandler(
        async (req: Request, res: Response) => {
            const orderId = req.params.id;
            const restaurantId = req.currentUser._id;
            if (!restaurantId)
                throw new ResourceNotFound('Restaurant owner not found');

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
        const restaurantId = req.currentUser._id;
        if (!restaurantId)
            throw new ResourceNotFound('Restaurant owner not found');
        const order = await this.orderService.cancelOrder({
            orderId,
            restaurantId,
        });
        sendJsonResponse(res, 200, 'Order cancelled successfully', order);
    });

    private getOrderById = asyncHandler(async (req: Request, res: Response) => {
        const orderId = req.params.id;
        const restaurantId = req.currentUser._id;
        if (!restaurantId)
            throw new ResourceNotFound('Restaurant owner not found');
        const order = await this.orderService.getOrderById({
            orderId,
            restaurantId,
        });
        sendJsonResponse(res, 200, 'Order retrieved successfully', order);
    });

    private getUsersOrders = asyncHandler(
        async (req: Request, res: Response) => {
            const restaurantId = req.currentUser._id;
            if (!restaurantId)
                throw new ResourceNotFound('Restaurant owner not found');

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
