import { Router, Request, Response } from 'express';
import { Controller, IPaginatedEntityResponse } from '../../types';
import validate from '../order/order-validation';
import { OrderService } from '../order/order-service';
import UserModel from '../user/user-model';
import RestaurantModel from '../restaurant/restaurant-model';
import AdminModel from '../admin/admin-model';
import OrderModel from '../order/order-model';
import { PaymentService } from '../gateway/payment-service';
import { WalletService } from '../wallet/wallet-service';
import { UserService } from '../user/user-service';
import { paginatedResults } from '../../utils/index';
import { IOrder } from '../order/order-interface';
import {
    validateData,
    sendJsonResponse,
    asyncHandler,
    ResourceNotFound,
    authAndAuthorize,
    BadRequest,
} from '../../middlewares';

export default class OrderController implements Controller {
    public path = '/order';
    public paths = '/orders';
    public router = Router();
    private orderService: OrderService;
    private paymentService: PaymentService;
    private userService: UserService;
    private walletService: WalletService;

    constructor() {
        this.userService = new UserService();
        this.walletService = new WalletService();
        this.orderService = new OrderService();
        this.paymentService = new PaymentService();

        // Set dependencies after creation
        this.orderService.setPaymentService(this.paymentService);
        this.paymentService.setServices(
            this.orderService,
            this.userService,
            this.walletService,
        );

        this.initializeRoutes();
    }

    private initializeRoutes(): void {
        this.router.get(
            `${this.paths}/cash-on-delivery-orders`,
            ...authAndAuthorize(AdminModel, ['admin']),
            paginatedResults(OrderModel, (req) => ({
                payment_method: 'cash_on_delivery',
            })),
            this.getAllCashOnDeliveryOrders,
        );
        this.router.post(
            `${this.path}`,
            ...authAndAuthorize(UserModel, ['user']),
            validateData(validate.orderSchema),
            this.createOrder,
        );
        this.router.post(
            `${this.path}/:orderId/confirm-delivery`,
            ...authAndAuthorize(RestaurantModel, ['restaurant_owner']),
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
            `${this.paths}`,
            ...authAndAuthorize(RestaurantModel, ['restaurant_owner']),
            this.getUsersOrders,
        );
    }

    private createOrder = asyncHandler(async (req: Request, res: Response) => {
        const userId = req.currentUser._id;
        const userEmail = req.currentUser.email;
        if (!userId) throw new ResourceNotFound('User not found');

        const orderData = req.body;
        const order = await this.orderService.placeOrder(userId, orderData);

        if (orderData.payment_method === 'cash_on_delivery') {
            await this.paymentService.processPayment({
                userId: userId,
                orderId: order._id.toString(),
                paymentMethod: 'cash_on_delivery',
                userEmail: userEmail,
            });
            sendJsonResponse(res, 201, 'Order placed successfully', order);
        } else if (orderData.payment_method === 'transfer') {
            const paymentResult = await this.paymentService.processPayment({
                userId: userId,
                orderId: order._id.toString(),
                paymentMethod: 'transfer',
                userEmail: userEmail,
            });
            sendJsonResponse(res, 202, 'Payment initialized', {
                order: order,
                payment: paymentResult.data,
            });
        } else {
            throw new BadRequest('Invalid payment method');
        }
    });

    private confirmDelivery = asyncHandler(
        async (req: Request, res: Response) => {
            const { orderId } = req.params;
            const restaurantId = req.currentUser._id;
            if (!restaurantId)
                throw new ResourceNotFound('Restaurant not found');

            const order = await this.orderService.confirmDelivery({
                orderId,
                restaurantId,
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

    private getAllCashOnDeliveryOrders = asyncHandler(
        async (req: Request, res: Response) => {
            const AdminId = req.currentUser._id;
            if (!AdminId) throw new ResourceNotFound('Admin owner not found');
            const paginatedResults =
                res.paginatedResults as IPaginatedEntityResponse<IOrder>;
            const orders =
                await this.orderService.getAllCashOnDeliveryOrders(
                    paginatedResults,
                );

            sendJsonResponse(
                res,
                200,
                'Cash on delivery orders retrieved successfully',
                orders,
            );
        },
    );
}
