import { Router, Request, Response, NextFunction } from 'express';
import { Controller } from '@/types/index';
import validate from '@/resources/restaurant/validation';
import { RestaurantService } from '@/resources/restaurant/service';
import { TokenService } from '@/utils/index';
import { upload } from '@/config/index';
import RestaurantModel from '@/resources/restaurant/model';
import {
    RegisterRestaurantto,
    Address,
} from '@/resources/restaurant/interface';
import {
    validateData,
    sendJsonResponse,
    asyncHandler,
    Conflict,
    ResourceNotFound,
    BadRequest,
    Forbidden,
    Unauthorized,
    authMiddleware,
    getCurrentUser,
} from '@/middlewares/index';

export default class RestaurantController implements Controller {
    public authPath = '/auth/restaurants';
    public path = '/restaurants';
    public router = Router();
    private restaurantService = new RestaurantService();

    constructor() {
        this.initializeRoutes();
    }

    private initializeRoutes(): void {
        this.router.post(
            `${this.authPath}/register`,
            upload.single('images'),
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
            authMiddleware(['restaurant_owner']),
            getCurrentUser(RestaurantModel),
            validateData(validate.registerSchema),
            asyncHandler(this.createRestaurant),
        );
    }

    public register = asyncHandler(
        async (req: Request, res: Response): Promise<void> => {
            const { name, email, password, street, city, state } = req.body;

            const address: Address = { street, city, state };

            const registrationData: RegisterRestaurantto = {
                name,
                email,
                password,
                address,
                businessLicense: '',
            };

            console.log('Registration data:', registrationData);
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

            if (!newPassword) {
                throw new BadRequest('New password is required');
            }

            await this.restaurantService.resetPassword(resetToken, newPassword);
            sendJsonResponse(res, 200, 'Password reset successfully.');
        },
    );

    private login = asyncHandler(
        async (req: Request, res: Response): Promise<void> => {
            const { email, password } = req.body;
            const result = await this.restaurantService.login({
                email,
                password,
            });
            sendJsonResponse(res, 200, 'Login successful', result);
        },
    );

    public createRestaurant = asyncHandler(
        async (req: Request, res: Response): Promise<void> => {
            const userId = req.currentUser?._id;
            const { name, email, password, street, city, state } = req.body;

            const address: Address = { street, city, state };

            const registrationData: RegisterRestaurantto = {
                name,
                email,
                password,
                address,
                businessLicense: '',
            };

            console.log('Registration data:', registrationData);
            const result = await this.restaurantService.register(
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
}
