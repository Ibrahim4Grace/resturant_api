// import axios from 'axios';
// import { config } from '@/config/index';
// import PaymentModel from '@/resources/payment/payment-model';
// import { OrderService } from '@/resources/order/order-service';
// import { EmailQueueService } from '@/utils/index';
// import {
//     PaymentInitiateDTO,
//     PaymentResponse,
//     IPayment,
// } from '@/resources/payment/payment-interface';
// import {
//     orderConfirmationEmail,
//     orderStatusUpdateEmail,
//     orderCancellationEmail,
//     riderAssignedEmail,
// } from '@/resources/order/order-email-template';

// import { ServerError, BadRequest } from '@/middlewares/index';

// export class PaymentService {
//     private paymentModel = PaymentModel;
//     private orderService = new OrderService();
//     private readonly paystackBaseUrl = 'https://api.paystack.co';
//     private readonly secretKey = config.PAYSTACK_SECRET_KEY;

//     private async handleCashPayment(
//         orderId: string,
//         userId: string,
//         amount: number,
//     ): Promise<IPayment> {
//         const payment = await PaymentModel.create({
//             orderId,
//             userId,
//             amount,
//             method: 'cash',
//             status: 'pending',
//         });

//         await this.orderService.updateOrderStatus(orderId, {
//             status: 'processing',
//             method: {
//                 method: 'cash',
//                 status: 'pending',
//             },
//         });

//         return payment;
//     }

//     private async initializePaystackPayment(
//         email: string,
//         amount: number,
//     ): Promise<PaymentInitialization> {
//         const response = await axios.post(
//             `${this.paystackBaseUrl}/transaction/initialize`,
//             { email, amount: amount * 100 }, // Paystack expects amount in kobo
//             { headers: { Authorization: `Bearer ${this.secretKey}` } },
//         );

//         return {
//             authorizationUrl: response.data.data.authorization_url,
//             reference: response.data.data.reference,
//         };
//     }

//     private async handlePaystackPayment(
//         orderId: string,
//         userId: string,
//         amount: number,
//         email: string,
//     ): Promise<{ authorizationUrl: string }> {
//         const paystackResponse = await this.initializePaystackPayment(
//             email,
//             amount,
//         );

//         await PaymentModel.create({
//             orderId,
//             userId,
//             amount,
//             method: 'paystack',
//             status: 'pending',
//             transactionDetails: {
//                 provider: 'paystack',
//                 reference: paystackResponse.reference,
//                 authorizationUrl: paystackResponse.authorizationUrl,
//             },
//         });

//         await this.orderService.updateOrderStatus(orderId, {
//             payment: {
//                 method: 'paystack',
//                 status: 'pending',
//                 transactionId: paystackResponse.reference,
//             },
//         });

//         return { authorizationUrl: paystackResponse.authorizationUrl };
//     }

//     private async handleSuccessfulCharge(reference: string): Promise<void> {
//         const verification = await this.verifyPayment(reference);

//         if (verification.status === 'completed') {
//             const order =
//                 await this.orderService.findByPaymentReference(reference);

//             if (order) {
//                 await this.orderService.updateOrderStatus(order._id, {
//                     status: 'processing',
//                     'payment.status': 'completed',
//                 });

//                 // Send confirmation email
//                 const user = await this.userService.getUserById(
//                     order.userId.toString(),
//                 );
//                 const emailOptions = orderConfirmationEmail(
//                     { name: user.name, email: user.email },
//                     order,
//                 );
//                 await EmailQueueService.addEmailToQueue(emailOptions);
//             }
//         }
//     }

//     private verifyPaystackSignature(
//         secret: string,
//         body: any,
//         signature: string,
//     ): boolean {
//         // Implement signature verification logic
//         return true; // Placeholder
//     }

//     async initiatePayment(
//         paymentData: PaymentInitiateDTO,
//     ): Promise<PaymentResponse> {
//         try {
//             const { orderId, userId, amount, method, email } = paymentData;

//             if (method === 'cash') {
//                 return await this.handleCashPayment(paymentData);
//             }

//             if (method === 'paystack') {
//                 return await this.handlePaystackPayment(paymentData);
//             }
//             throw new BadRequest('Invalid payment method');
//         } catch (error) {
//             throw new ServerError('Payment initialization failed');
//         }
//     }

//     async handleWebhook(
//         event: string,
//         data: any,
//         signature: string,
//     ): Promise<void> {
//         try {
//             const secret = config.PAYSTACK_SECRET_KEY;
//             const signature = req.headers['x-paystack-signature'];

//             if (
//                 !signature ||
//                 !this.verifyPaystackSignature(secret, req.body, signature)
//             ) {
//                 throw new Unauthorized('Invalid signature');
//             }

//             const { event, data } = req.body;

//             if (event === 'charge.success') {
//                 await this.handleSuccessfulCharge(data.reference);
//             }

//             res.status(200).json({ status: 'success' });
//         } catch (error) {
//             throw new ServerError('Webhook processing failed');
//         }
//     }
// }
