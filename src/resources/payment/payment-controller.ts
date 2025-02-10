// import express, { Router, Request, Response } from 'express';
// import { PaymentService } from '@/resources/payment/payment-service';
// import { config } from '@/config/index';
// import { OrderService } from '@/resources/order/order-service';
// import { UserService } from '@/resources/user/user-service';
// import { PaystackSignature } from '@/resources/payment/payment-utils';
// import { EmailQueueService } from '@/utils/index';
// import { orderConfirmationEmail } from '@/resources/order/order-email-template';
// import { Controller } from '@/types/index';
// import UserModel from '@/resources/user/user-model';
// import {
//     Unauthorized,
//     ServerError,
//     asyncHandler,
//     ResourceNotFound,
//     authMiddleware,
//     authorization,
// } from '@/middlewares/index';

// export default class PaymentController implements Controller {
//     public path = '/payment';
//     public router = Router();
//     private paymentService: PaymentService;
//     private orderService: OrderService;
//     private userService: UserService;

//     constructor() {
//         this.paymentService = new PaymentService(this.orderService);
//         this.orderService = new OrderService();
//         this.userService = new UserService();
//         this.initializeRoutes();
//     }

//     private initializeRoutes(): void {
//         this.router.post(
//             `${this.path}/initialize`,
//             authMiddleware(),
//      authorization(UserModel, ['user']),

//             this.initiatePayment,
//         );

//         this.router.post(
//             `${this.path}/webhook`,
//             express.raw({ type: 'application/json' }),
//             this.handleWebhook,
//         );
//     }

//     private initiatePayment = asyncHandler(
//         async (req: Request, res: Response) => {
//             const userId = req.currentUser?._id;
//             if (!userId) {
//                 throw new ResourceNotFound('User not found');
//             }

//             const { orderId, method, email } = req.body;

//             if (!['paystack', 'cash'].includes(method)) {
//                 throw new Error('Invalid payment method');
//             }

//             const order = await this.orderService.getOrderById(orderId);
//             if (!order) {
//                 throw new ResourceNotFound('Order not found');
//             }

//             if (order.payment?.status === 'completed') {
//                 throw new Error('Order has already been paid for');
//             }

//             const payment = await this.paymentService.initiatePayment({
//                 orderId,
//                 userId,
//                 amount: order.total_price,
//                 method,
//                 email,
//             });

//             const emailOptions = orderConfirmationEmail(req.currentUser, order);
//             await EmailQueueService.addEmailToQueue(emailOptions);

//             res.status(200).json({
//                 status: 'success',
//                 message: 'Payment initiated successfully',
//                 data: payment,
//             });
//         },
//     );

//     private handleWebhook = asyncHandler(
//         async (req: Request, res: Response) => {
//             await this.paymentService.handleWebhook(req, res);
//         },
//     );
// }
