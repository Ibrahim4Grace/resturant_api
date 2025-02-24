import express, { Router, Request, Response } from 'express';
import { PaymentService } from '../payment/payment-service';
import { OrderService } from '../order/order-service';
import { UserService } from '../user/user-service';
import { paymentProcess } from '../payment/payment-interface';
import { Controller } from '../../types/index';
import UserModel from '../user/user-model';
import validate from '../payment/payment-validation';
import {
    validateData,
    asyncHandler,
    ResourceNotFound,
    authMiddleware,
    authorization,
    sendJsonResponse,
    BadRequest,
} from '../../middlewares/index';

export default class PaymentController implements Controller {
    public path = '/payments';
    public router = Router();
    private paymentService: PaymentService;
    private orderService: OrderService;
    private userService: UserService;

    constructor() {
        this.initializeRoutes();
        this.orderService = new OrderService();
        this.userService = new UserService();
        this.paymentService = new PaymentService(
            this.orderService,
            this.userService,
        );
    }

    private initializeRoutes(): void {
        this.router.post(
            `${this.path}/initialize`,
            authMiddleware(),
            authorization(UserModel, ['user']),
            validateData(validate.paymentSchema),
            this.processPayment,
        );

        this.router.post(
            `${this.path}/webhook`,
            express.raw({ type: 'application/json' }),
            this.handleWebhook,
        );
    }

    private processPayment = asyncHandler(
        async (req: Request, res: Response) => {
            const { orderId, paymentMethod } = req.body;
            const userId = req.currentUser?._id;

            if (!userId) {
                throw new ResourceNotFound('User not found');
            }

            const params: paymentProcess = {
                userId: userId.toString(),
                orderId,
                paymentMethod,
                userEmail: req.currentUser.email,
            };

            const result = await this.paymentService.processPayment(params);

            return sendJsonResponse(res, 200, result.message, result.data);
        },
    );

    private handleWebhook = asyncHandler(
        async (req: Request, res: Response) => {
            const parsedBody = req.body;
            const signature = req.headers['x-paystack-signature'] as string;

            if (!signature) {
                throw new BadRequest('Missing Paystack signature');
            }

            const { event, data } = parsedBody;

            const success = await this.paymentService.handleWebhookEvent(
                event,
                data,
                signature,
                JSON.stringify(parsedBody),
            );

            return res.status(success ? 200 : 400).json({
                success,
                message: success
                    ? 'Webhook processed successfully'
                    : 'Webhook processing failed',
            });
        },
    );
}
