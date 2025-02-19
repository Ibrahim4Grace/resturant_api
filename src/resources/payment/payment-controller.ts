import express, { Router, Request, Response } from 'express';
import { PaymentService } from '../../resources/payment/payment-service';
import { OrderService } from '../../resources/order/order-service';
import { UserService } from '../../resources/user/user-service';
import { paymentProcess } from '../../resources/payment/payment-interface';
import { Controller } from '../../types/index';
import UserModel from '../../resources/user/user-model';
import validate from '../../resources/payment/payment-validation';
import {
    validateData,
    asyncHandler,
    ResourceNotFound,
    authMiddleware,
    authorization,
    sendJsonResponse,
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
            (req, res, next) => {
                console.log('Webhook route hit:', new Date().toISOString());
                next();
            },
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
            console.log('Payment Initialize Request Body:', req.body);

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
            try {
                const rawBody = req.body.toString('utf8'); // Get the raw body as a string
                const signature = req.headers['x-paystack-signature'] as string;

                if (!signature) {
                    return res.status(400).json({
                        success: false,
                        message: 'Missing Paystack signature',
                    });
                }

                // Parse the raw body to JSON
                const parsedBody = JSON.parse(rawBody);
                const { event, data } = parsedBody;

                // Process the webhook event in the service layer
                const success = await this.paymentService.handleWebhookEvent(
                    event,
                    data,
                    signature,
                    rawBody, // Pass the raw body for logging or further processing
                );

                return res.status(success ? 200 : 400).json({
                    success,
                    message: success
                        ? 'Webhook processed successfully'
                        : 'Webhook processing failed',
                });
            } catch (error) {
                console.error('🚨 Webhook processing error:', error);
                return res.status(500).json({
                    success: false,
                    message: 'Internal server error processing webhook',
                });
            }
        },
    );

    // private handleWebhook = asyncHandler(
    //     async (req: Request, res: Response) => {
    //         const { event, data } = req.body;
    //         const signature = req.headers['x-paystack-signature'] as string;

    //         const success = await this.paymentService.handleWebhookEvent(
    //             event,
    //             data,
    //             signature,
    //         );

    //         return res.status(success ? 200 : 400).json({
    //             success,
    //             message: success
    //                 ? 'Webhook processed successfully'
    //                 : 'Webhook processing failed',
    //         });
    //     },
    // );
}
