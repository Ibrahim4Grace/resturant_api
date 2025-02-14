import { Router, Request, Response, NextFunction } from 'express';
import { Controller } from '../../types/index';
import validate from '../../resources/user/user-validation';
import { UserService } from '../../resources/user/user-service';
import UserModel from '../../resources/user/user-model';
import { RegisterUserto, Address } from '../../resources/user/user-interface';
import { TokenService } from '../../utils/index';
import {
    validateData,
    sendJsonResponse,
    asyncHandler,
    ResourceNotFound,
    BadRequest,
    authMiddleware,
    authorization,
} from '../../middlewares/index';

export default class UserController implements Controller {
    public authPath = '/auth/users';
    public path = '/user';
    public router = Router();
    private userService = new UserService();

    constructor() {
        this.initializeRoutes();
    }

    private initializeRoutes(): void {
        this.router.post(
            `${this.authPath}/register`,
            validateData(validate.registerSchema),
            this.register,
        );
        this.router.post(
            `${this.authPath}/verify-otp`,
            validateData(validate.verifyOtpSchema),
            this.registrationOTP,
        );
        this.router.post(
            `${this.authPath}/forgot`,
            validateData(validate.forgetPwdSchema),
            this.forgotPassword,
        );
        this.router.post(
            `${this.authPath}/password/verify-otp`,
            validateData(validate.verifyOtpSchema),
            this.resetPasswordOTP,
        );
        this.router.post(
            `${this.authPath}/password/reset`,
            validateData(validate.resetPasswordSchema),
            this.resetPassword,
        );
        this.router.post(
            `${this.authPath}/login`,
            validateData(validate.loginSchema),
            this.login,
        );
        this.router.get(
            `${this.path}/address`,
            authMiddleware(),
            authorization(UserModel, ['user']),
            this.getUserAddress,
        );
        this.router.get(
            `${this.path}`,
            authMiddleware(),
            authorization(UserModel, ['user']),
            this.getUser,
        );
        this.router.put(
            `${this.path}`,
            authMiddleware(),
            authorization(UserModel, ['user']),
            validateData(validate.updateUserSchema),
            this.updateUser,
        );
        this.router.post(
            `${this.path}/address`,
            authMiddleware(),
            authorization(UserModel, ['user']),
            validateData(validate.addressesSchema),
            this.addNewAddress,
        );
        this.router.delete(
            `${this.path}/address/:id`,
            authMiddleware(),
            authorization(UserModel, ['user']),
            this.deleteAddress,
        );
        this.router.get(
            `${this.path}/orders`,
            authMiddleware(),
            authorization(UserModel, ['user']),
            this.getUserOrders,
        );
        this.router.get(
            `${this.path}/orders/:orderId`,
            authMiddleware(),
            authorization(UserModel, ['user']),
            this.getUserOrder,
        );
    }

    private register = asyncHandler(
        async (req: Request, res: Response): Promise<void> => {
            const { name, email, password, phone, street, city, state } =
                req.body;

            const addresses: Address = { street, city, state };

            const registrationData: RegisterUserto = {
                name,
                email,
                password,
                phone,
                addresses,
            };

            const result = await this.userService.register(registrationData);
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

            const user = await this.userService.verifyRegistrationOTP(
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
        async (
            req: Request,
            res: Response,
            next: NextFunction,
        ): Promise<void> => {
            const { email } = req.body;
            const resetToken = await this.userService.forgotPassword(email);
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

            await this.userService.verifyResetPasswordOTP(resetToken, otp);
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

            await this.userService.resetPassword(resetToken, newPassword);
            sendJsonResponse(res, 200, 'Password reset successfully.');
        },
    );

    private login = asyncHandler(
        async (req: Request, res: Response): Promise<void> => {
            const { email, password } = req.body;
            const result = await this.userService.login({
                email,
                password,
            });
            sendJsonResponse(res, 200, 'Login successful', result);
        },
    );

    private getUser = asyncHandler(
        async (req: Request, res: Response): Promise<void> => {
            const userId = req.currentUser?._id;
            if (!userId) {
                throw new ResourceNotFound('User not found');
            }
            const user = await this.userService.getUserById(userId);

            sendJsonResponse(res, 200, 'User retrieved successfully', user);
        },
    );

    private updateUser = asyncHandler(
        async (req: Request, res: Response): Promise<void> => {
            const userId = req.currentUser?._id;
            if (!userId) {
                throw new ResourceNotFound('User not found');
            }
            const updateData = req.body;
            const updatedUser = await this.userService.updateUserById(
                userId,
                updateData,
            );

            if (!updatedUser) {
                throw new ResourceNotFound('User not found or update failed');
            }

            sendJsonResponse(
                res,
                200,
                'User data updated successfully',
                updatedUser,
            );
        },
    );

    private addNewAddress = asyncHandler(
        async (req: Request, res: Response): Promise<void> => {
            const userId = req.currentUser?._id;
            if (!userId) throw new ResourceNotFound('User not found');

            const { street, city, state } = req.body;

            const addressAdded = await this.userService.addNewAddress(userId, {
                street,
                city,
                state,
            });

            sendJsonResponse(res, 201, 'Address added successfully', {
                addressAdded,
            });
        },
    );

    private getUserAddress = asyncHandler(
        async (req: Request, res: Response): Promise<void> => {
            const userId = req.currentUser?._id;
            if (!userId) throw new ResourceNotFound('User not found');

            const addresses = await this.userService.getUserAddress(userId);

            sendJsonResponse(
                res,
                200,
                'Addresses retrieved successfully',
                addresses,
            );
        },
    );

    private deleteAddress = asyncHandler(
        async (req: Request, res: Response): Promise<void> => {
            const userId = req.currentUser?._id;
            if (!userId) throw new ResourceNotFound('User not found');

            const addressId = req.params.id;
            await this.userService.deleteAddress(userId, addressId);
            sendJsonResponse(res, 200, 'Address deleted successfully');
        },
    );

    private getUserOrders = asyncHandler(
        async (req: Request, res: Response) => {
            const userId = req.currentUser?._id;
            if (!userId) {
                throw new ResourceNotFound('User not found');
            }

            const orders = await this.userService.getUserOrders(
                userId.toString(),
            );
            return sendJsonResponse(
                res,
                200,
                'Orders retrieved successfully',
                orders,
            );
        },
    );

    private getUserOrder = asyncHandler(
        async (req: Request, res: Response): Promise<void> => {
            const userId = req.currentUser?._id;
            const orderId = req.params.orderId;
            if (!userId) {
                throw new ResourceNotFound('User not foundw');
            }
            const orders = await this.userService.getUserOrder(userId, orderId);

            sendJsonResponse(res, 200, 'Orders retrieved successfully', orders);
        },
    );
}
