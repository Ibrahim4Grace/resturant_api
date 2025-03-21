import { Router, Request, Response, NextFunction } from 'express';
import { Controller } from '../../types/index';
import validate from '../restaurant/restaurant-validation';
import { RestaurantService } from '../restaurant/restaurant-service';
import { TokenService } from '../../utils/index';
import { upload } from '../../config/index';
import RestaurantModel from '../restaurant/restaurant-model';
import {
    RegisterRestaurantto,
    Address,
} from '../restaurant/restaurant-interface';
import {
    validateData,
    sendJsonResponse,
    asyncHandler,
    ResourceNotFound,
    BadRequest,
    Unauthorized,
    authMiddleware,
    authAndAuthorize,
} from '../../middlewares/index';

export default class RestaurantController implements Controller {
    public authPath = '/auth/restaurant';
    public path = '/restaurant';
    public router = Router();
    private restaurantService = new RestaurantService();

    constructor() {
        this.initializeRoutes();
    }

    private initializeRoutes(): void {
        this.router.post(
            `${this.authPath}/register`,
            upload.single('businessLicense'),
            validateData(validate.registerSchema),
            this.register,
        );
        this.router.post(
            `${this.authPath}/verify-otp`,
            validateData(validate.verifyOtpSchema),
            asyncHandler(this.registrationOTP),
        );
        this.router.post(
            `${this.authPath}/forgot`,
            validateData(validate.forgetPwdSchema),
            asyncHandler(this.forgotPassword),
        );
        this.router.post(
            `${this.authPath}/password/verify-otp`,
            validateData(validate.verifyOtpSchema),
            asyncHandler(this.resetPasswordOTP),
        );
        this.router.post(
            `${this.authPath}/password/reset`,
            validateData(validate.resetPasswordSchema),
            asyncHandler(this.resetPassword),
        );
        this.router.post(
            `${this.authPath}/login`,
            validateData(validate.loginSchema),
            asyncHandler(this.login),
        );
        this.router.post(
            `${this.path}/register`,
            authMiddleware(),
            upload.single('businessLicense'),
            validateData(validate.createSchema),
            this.createRestaurant,
        );
        this.router.get(
            `${this.path}`,
            ...authAndAuthorize(RestaurantModel, ['restaurant_owner']),
            this.getRestaurant,
        );
        this.router.put(
            `${this.path}`,
            ...authAndAuthorize(RestaurantModel, ['restaurant_owner']),
            validateData(validate.updateSchema),
            this.updateRestaurant,
        );
        this.router.post(
            `${this.path}/password/reset`,
            ...authAndAuthorize(RestaurantModel, ['restaurant_owner']),
            validateData(validate.changePassword),
            this.changePassword,
        );
        this.router.get(
            `${this.path}/analytics`,
            ...authAndAuthorize(RestaurantModel, ['restaurant_owner']),
            this.getRestaurantAnalytics,
        );
        this.router.get(
            `${this.path}/orders`,
            ...authAndAuthorize(RestaurantModel, ['restaurant_owner']),
            this.getRestaurantOrders,
        );
    }

    public register = asyncHandler(
        async (req: Request, res: Response): Promise<void> => {
            const { name, email, password, phone, street, city, state } =
                req.body;

            const address: Address = { street, city, state };

            const registrationData: RegisterRestaurantto = {
                name,
                email,
                password,
                address,
                phone,
                businessLicense: req.file
                    ? { imageId: req.file.filename, imageUrl: req.file.path }
                    : undefined,
            };

            const result = await this.restaurantService.register(
                registrationData,
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

            const user = await this.restaurantService.verifyRegistrationOTP(
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
            const resetToken =
                await this.restaurantService.forgotPassword(email);
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

            await this.restaurantService.verifyResetPasswordOTP(
                resetToken,
                otp,
            );
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

            if (!newPassword) throw new BadRequest('New password is required');

            await this.restaurantService.resetPassword(resetToken, newPassword);
            sendJsonResponse(res, 200, 'Password reset successfully.');
        },
    );

    private login = asyncHandler(
        async (req: Request, res: Response): Promise<void> => {
            const credentials = req.body;
            const result = await this.restaurantService.login(credentials);
            sendJsonResponse(res, 200, 'Login successful', result);
        },
    );

    public createRestaurant = asyncHandler(
        async (req: Request, res: Response): Promise<void> => {
            const user = req.user;
            if (!user) {
                throw new Unauthorized('User not authenticated');
            }
            const userId = user.id;
            const { name, password, phone, street, city, state } = req.body;

            const address: Address = { street, city, state };

            const registrationData: RegisterRestaurantto = {
                name,
                email: user.email,
                phone,
                password,
                ownerId: userId,
                address,
                businessLicense: req.file
                    ? { imageId: req.file.filename, imageUrl: req.file.path }
                    : undefined,
                isEmailVerified: true,
            };

            const result = await this.restaurantService.createRestaurant(
                registrationData,
                req.file,
            );

            sendJsonResponse(
                res,
                201,
                'Restaurant successfully created',
                result,
            );
        },
    );

    private getRestaurant = asyncHandler(
        async (req: Request, res: Response): Promise<void> => {
            const restaurantId = req.currentUser._id;
            if (!restaurantId)
                throw new ResourceNotFound('Restaurant not found');
            const restaurant =
                await this.restaurantService.getRestaurant(restaurantId);

            sendJsonResponse(
                res,
                200,
                'Restaurant retrieved successfully',
                restaurant,
            );
        },
    );

    private updateRestaurant = asyncHandler(
        async (req: Request, res: Response): Promise<void> => {
            const restaurantId = req.currentUser._id;
            if (!restaurantId)
                throw new ResourceNotFound('Restaurant not found');

            // Transform the request body
            const { street, city, state, ...rest } = req.body;
            const updateData = {
                ...rest,
                address: { street, city, state },
            };

            const updatedRestaurant =
                await this.restaurantService.updateRestaurant(
                    restaurantId,
                    updateData,
                );

            if (!updatedRestaurant) {
                throw new ResourceNotFound(
                    'Restaurant not found or update failed',
                );
            }

            sendJsonResponse(
                res,
                200,
                'Restaurant data updated successfully',
                updatedRestaurant,
            );
        },
    );

    private changePassword = asyncHandler(
        async (req: Request, res: Response): Promise<void> => {
            const restaurantId = req.currentUser._id;
            if (!restaurantId)
                throw new ResourceNotFound('Restaurant not found');
            const { currentPassword, newPassword } = req.body;

            await this.restaurantService.changePassword(
                restaurantId,
                currentPassword,
                newPassword,
            );

            sendJsonResponse(res, 200, 'Password reset successfully');
        },
    );
    private getRestaurantAnalytics = asyncHandler(
        async (req: Request, res: Response): Promise<void> => {
            const restaurantId = req.currentUser._id;
            if (!restaurantId)
                throw new ResourceNotFound('Restaurant not found');

            const analytics =
                await this.restaurantService.getRestaurantAnalytics(
                    restaurantId,
                );

            sendJsonResponse(
                res,
                200,
                'Restaurant analytics retrieved successfully',
                analytics,
            );
        },
    );

    private getRestaurantOrders = asyncHandler(
        async (req: Request, res: Response): Promise<void> => {
            const restaurantId = req.currentUser._id;
            if (!restaurantId)
                throw new ResourceNotFound('Restaurant not found');

            const orders = await this.restaurantService.getRestaurantOrders(
                req,
                res,
                restaurantId,
            );

            sendJsonResponse(
                res,
                200,
                'Restaurant orders retrieved successfully',
                orders,
            );
        },
    );
}
