import { Router, Request, Response, NextFunction } from 'express';
import { Controller, IPaginatedEntityResponse } from '../../types/index';
import validate from '../rider/rider-validation';
import { RiderService } from '../rider/rider-service';
import { TokenService, paginatedResults } from '../../utils/index';
import RiderModel from '../rider/rider-model';
import OrderModel from '../order/order-model';
import { upload } from '../../config/index';
import { IOrder } from '../order/order-interface';
import { Address, RegisterRiderto } from '../rider/rider-interface';

import {
    validateData,
    sendJsonResponse,
    asyncHandler,
    BadRequest,
    authMiddleware,
    authorization,
    ResourceNotFound,
} from '../../middlewares/index';

export default class RiderController implements Controller {
    public authPath = '/auth/rider';
    public path = '/rider';
    public router = Router();
    private riderService = new RiderService();

    constructor() {
        this.initializeRoutes();
    }

    private initializeRoutes(): void {
        this.router.post(
            `${this.authPath}/register`,
            upload.single('licenseImage'),
            validateData(validate.register),
            this.register,
        );

        this.router.post(
            `${this.authPath}/verify-otp`,
            validateData(validate.verifyOtp),
            this.registrationOTP,
        );

        this.router.post(
            `${this.authPath}/forgot`,
            validateData(validate.forgetPwd),
            this.forgotPassword,
        );
        this.router.post(
            `${this.authPath}/password/verify-otp`,
            validateData(validate.verifyOtp),
            this.resetPasswordOTP,
        );
        this.router.post(
            `${this.authPath}/password/reset`,
            validateData(validate.resetPassword),
            this.resetPassword,
        );
        this.router.post(
            `${this.authPath}/login`,
            validateData(validate.login),
            this.login,
        );
        this.router.get(
            `${this.path}/profile`,
            authMiddleware(),
            authorization(RiderModel, ['rider']),
            this.getRider,
        );
        this.router.put(
            `${this.path}/profile`,
            authMiddleware(),
            authorization(RiderModel, ['rider']),
            validateData(validate.updateSchema),
            this.updateRiderProfile,
        );
        this.router.post(
            `${this.path}/password/reset`,
            authMiddleware(),
            authorization(RiderModel, ['rider']),
            validateData(validate.changePassword),
            this.changePassword,
        );
        this.router.get(
            `${this.path}/orders/ready-for-pickup`,
            authMiddleware(),
            authorization(RiderModel, ['rider']),
            paginatedResults(OrderModel, (req) => ({
                status: 'ready_for_pickup',
            })),
            this.orderReadyForPickup,
        );
        this.router.post(
            `${this.path}/orders/:orderId/pickup`,
            authMiddleware(),
            authorization(RiderModel, ['rider']),
            validateData(validate.pickOrder),
            this.pickOrder,
        );
        this.router.put(
            `${this.path}/delivery/:orderId/status`,
            authMiddleware(),
            authorization(RiderModel, ['rider']),
            validateData(validate.orderStatus),
            this.updateOrderStatus,
        );
        this.router.get(
            `${this.path}/deliveries`,
            authMiddleware(),
            authorization(RiderModel, ['rider']),
            this.getRiderDeliveries,
        );
        this.router.get(
            `${this.path}/deliveries/:deliveryId`,
            authMiddleware(),
            authorization(RiderModel, ['rider']),
            this.getRiderDeliveriesById,
        );
    }

    private register = asyncHandler(
        async (req: Request, res: Response): Promise<void> => {
            const { name, email, phone, password, street, city, state } =
                req.body;

            const address: Address = { street, city, state };

            const riderData: RegisterRiderto = {
                name,
                email,
                password,
                phone,
                address,
                licenseImage: req.file
                    ? { imageId: req.file.filename, imageUrl: req.file.path }
                    : undefined,
            };

            const result = await this.riderService.register(
                riderData,
                req.file,
            );

            sendJsonResponse(
                res,
                201,
                'Registration initiated. Please verify your email with the OTP sent.',
                result,
            );
        },
    );

    private registrationOTP = asyncHandler(
        async (req: Request, res: Response): Promise<void> => {
            const { otp } = req.body;
            const authHeader = req.headers.authorization;

            if (!authHeader || !authHeader.startsWith('Bearer ')) {
                throw new BadRequest('Authorization token is required');
            }

            if (!otp) {
                throw new BadRequest('OTP code is required');
            }

            const token = authHeader.split(' ')[1];

            const decoded = await TokenService.verifyEmailToken(token);

            const user = await this.riderService.verifyRegistrationOTP(
                decoded.userId.toString(),
                otp,
            );

            sendJsonResponse(
                res,
                200,
                'Email verified successfully. You can now log in.',
            );
        },
    );

    private forgotPassword = asyncHandler(
        async (req: Request, res: Response): Promise<void> => {
            const { email } = req.body;
            const resetToken = await this.riderService.forgotPassword(email);
            sendJsonResponse(
                res,
                200,
                'Reset token generated and OTP sent to your email.',
                resetToken,
            );
        },
    );

    private resetPasswordOTP = asyncHandler(
        async (req: Request, res: Response): Promise<void> => {
            const authHeader = req.headers.authorization;
            if (!authHeader || !authHeader.startsWith('Bearer ')) {
                throw new BadRequest('Authorization token is required');
            }

            const resetToken = authHeader.split(' ')[1];
            const { otp } = req.body;

            if (!otp) {
                throw new BadRequest('OTP is required');
            }

            await this.riderService.verifyResetPasswordOTP(resetToken, otp);
            sendJsonResponse(
                res,
                200,
                'OTP verified successfully. You can now reset your password.',
            );
        },
    );

    private resetPassword = asyncHandler(
        async (req: Request, res: Response): Promise<void> => {
            const authHeader = req.headers.authorization;
            if (!authHeader || !authHeader.startsWith('Bearer ')) {
                throw new BadRequest('Authorization token is required');
            }

            const resetToken = authHeader.split(' ')[1];
            const { newPassword } = req.body;

            if (!newPassword) {
                throw new BadRequest('New password is required');
            }

            await this.riderService.resetPassword(resetToken, newPassword);
            sendJsonResponse(res, 200, 'Password reset successfully.');
        },
    );

    private login = asyncHandler(
        async (req: Request, res: Response): Promise<void> => {
            const { email, password } = req.body;
            const result = await this.riderService.login({
                email,
                password,
            });
            sendJsonResponse(res, 200, 'Login successful', result);
        },
    );

    private getRider = asyncHandler(
        async (req: Request, res: Response): Promise<void> => {
            const riderId = req.currentUser._id;
            if (!riderId) {
                throw new ResourceNotFound('Rider not found');
            }
            const rider = await this.riderService.getRiderById(riderId);

            sendJsonResponse(res, 200, 'Rider retrieved successfully', rider);
        },
    );

    private updateRiderProfile = asyncHandler(
        async (req: Request, res: Response): Promise<void> => {
            const riderId = req.currentUser._id;
            if (!riderId) {
                throw new ResourceNotFound('User not found');
            }
            const updateData = req.body;
            const updatedRider = await this.riderService.updateRiderById(
                riderId,
                updateData,
            );

            if (!updatedRider) {
                throw new ResourceNotFound('Rider not found or update failed');
            }

            sendJsonResponse(
                res,
                200,
                'Rider data updated successfully',
                updatedRider,
            );
        },
    );

    private changePassword = asyncHandler(
        async (req: Request, res: Response): Promise<void> => {
            const riderId = req.currentUser._id;
            if (!riderId) {
                throw new ResourceNotFound('Rider not found');
            }
            const { currentPassword, newPassword } = req.body;

            await this.riderService.changePassword(
                riderId,
                currentPassword,
                newPassword,
            );

            sendJsonResponse(res, 200, 'Password reset successfully');
        },
    );

    private orderReadyForPickup = asyncHandler(
        async (req: Request, res: Response): Promise<void> => {
            const riderId = req.currentUser._id;
            if (!riderId) {
                throw new ResourceNotFound('Rider not found');
            }
            const paginatedResults =
                res.paginatedResults as IPaginatedEntityResponse<IOrder>;
            const orders =
                await this.riderService.getReadytToPickOrder(paginatedResults);
            sendJsonResponse(
                res,
                200,
                'Ready for pickup orders retrieved successfully',
                orders,
            );
        },
    );

    private pickOrder = asyncHandler(
        async (req: Request, res: Response): Promise<void> => {
            const riderId = req.currentUser._id;
            if (!riderId) {
                throw new ResourceNotFound('Rider not found');
            }
            const { orderId } = req.params;

            const order = await this.riderService.claimOrder(riderId, orderId);
            sendJsonResponse(res, 200, 'Order claimed successfully', order);
        },
    );

    private updateOrderStatus = asyncHandler(
        async (req: Request, res: Response): Promise<void> => {
            const riderId = req.currentUser._id;
            if (!riderId) {
                throw new ResourceNotFound('Rider not found');
            }
            const { orderId } = req.params;
            const { status } = req.body;

            if (!status) {
                throw new BadRequest('Status is required');
            }

            const updatedOrder = await this.riderService.updateOrderStatus({
                riderId,
                orderId,
                status,
            });
            sendJsonResponse(
                res,
                200,
                'Order status updated successfully',
                updatedOrder,
            );
        },
    );

    private getRiderDeliveries = asyncHandler(
        async (req: Request, res: Response): Promise<void> => {
            const riderId = req.currentUser._id;
            if (!riderId) {
                throw new ResourceNotFound('Rider not found');
            }

            const deliveries = await this.riderService.getRiderDeliveries(
                req,
                res,
                riderId,
            );

            sendJsonResponse(
                res,
                200,
                'deliveries retrieve successfully',
                deliveries,
            );
        },
    );

    private getRiderDeliveriesById = asyncHandler(
        async (req: Request, res: Response): Promise<void> => {
            const riderId = req.currentUser._id;
            if (!riderId) {
                throw new ResourceNotFound('Rider not found');
            }
            const { deliveryId } = req.params;
            const delivery = await this.riderService.getRiderDeliveriesById(
                riderId,
                deliveryId,
            );

            sendJsonResponse(
                res,
                200,
                'deliveries retrieve successfully',
                delivery,
            );
        },
    );
}
