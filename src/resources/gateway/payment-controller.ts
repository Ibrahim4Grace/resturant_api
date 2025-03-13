import express, { Router, Request, Response } from 'express';
import { PaymentService } from '../gateway/payment-service';
import { OrderService } from '../order/order-service';
import { WalletService } from '../wallet/wallet-service';
import { UserService } from '../user/user-service';
import { paymentProcess } from '../gateway/payment-interface';
import { Controller } from '../../types/index';
import UserModel from '../user/user-model';
import validate from '../gateway/payment-validation';
import {
    validateData,
    asyncHandler,
    ResourceNotFound,
    authAndAuthorize,
    sendJsonResponse,
    BadRequest,
} from '../../middlewares/index';

export default class PaymentController implements Controller {
    public path = '/payment';
    public router = Router();
    private paymentService: PaymentService;
    private orderService: OrderService;
    private userService: UserService;
    private walletService: WalletService;

    constructor() {
        this.walletService = new WalletService();
        this.userService = new UserService();
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
        this.router.post(
            `${this.path}/initialize`,
            ...authAndAuthorize(UserModel, ['user']),
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
                userId: userId,
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
            if (!signature) throw new BadRequest('Missing Paystack signature');

            const { event, data } = parsedBody;

            let success = false;

            if (event.startsWith('charge.')) {
                success = await this.paymentService.handleWebhookEvent({
                    event,
                    data,
                    signature,
                    rawBody: JSON.stringify(parsedBody),
                });
            } else if (event.startsWith('transfer.')) {
                success = await this.walletService.handleTransferWebhook({
                    event,
                    data,
                    signature,
                    rawBody: JSON.stringify(parsedBody),
                });
            }

            return res.status(success ? 200 : 400).json({
                success,
                message: success
                    ? 'Webhook processed successfully'
                    : 'Webhook processing failed',
            });
        },
    );
}
