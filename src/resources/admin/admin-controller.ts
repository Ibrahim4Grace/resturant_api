import { Router, Request, Response, NextFunction } from 'express';
import { Controller } from '@/types/index';
import validate from '@/resources/admin/admin-validation';
import { AdminService } from '@/resources/admin/admin-service';
import { TokenService } from '@/utils/index';
import AdminModel from '@/resources/admin/admin-model';
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

export default class AdminController implements Controller {
    public authPath = '/auth/admins';
    public path = '/admins';
    public router = Router();
    private adminService = new AdminService();

    constructor() {
        this.initializeRoutes();
    }

    private initializeRoutes(): void {
        this.router.post(
            `${this.authPath}/register`,
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
            `${this.path}/users`,
            authMiddleware(['admin']),
            getCurrentUser(AdminModel),
            this.getUsers,
        );
        this.router.get(
            `${this.path}/users/:id`,
            authMiddleware(['admin']),
            getCurrentUser(AdminModel),
            this.getUsersById,
        );
        this.router.delete(
            `${this.path}/users/:id`,
            authMiddleware(['admin']),
            getCurrentUser(AdminModel),
            this.deleteUserById,
        );

        this.router.get(
            `${this.path}/restaurants`,
            authMiddleware(['admin']),
            getCurrentUser(AdminModel),
            this.getRestaurants,
        );
        this.router.get(
            `${this.path}/restaurants/:id`,
            authMiddleware(['admin']),
            getCurrentUser(AdminModel),
            this.getRestaurantsById,
        );
        this.router.delete(
            `${this.path}/restaurants/:id`,
            authMiddleware(['admin']),
            getCurrentUser(AdminModel),
            this.deleteRestaurantById,
        );

        this.router.get(
            `${this.path}/riders`,
            authMiddleware(['admin']),
            getCurrentUser(AdminModel),
            this.getRiders,
        );
        this.router.get(
            `${this.path}/riders/:id`,
            authMiddleware(['admin']),
            getCurrentUser(AdminModel),
            this.getRidersById,
        );
        this.router.delete(
            `${this.path}/riders/:id`,
            authMiddleware(['admin']),
            getCurrentUser(AdminModel),
            this.deleteRiderById,
        );
    }

    private register = asyncHandler(
        async (req: Request, res: Response): Promise<void> => {
            const { name, email, password } = req.body;
            const result = await this.adminService.register({
                name,
                email,
                password,
            });
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

            const user = await this.adminService.verifyRegistrationOTP(
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
            const resetToken = await this.adminService.forgotPassword(email);
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

            await this.adminService.verifyResetPasswordOTP(resetToken, otp);
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

            await this.adminService.resetPassword(resetToken, newPassword);
            sendJsonResponse(res, 200, 'Password reset successfully.');
        },
    );

    private login = asyncHandler(
        async (req: Request, res: Response): Promise<void> => {
            const { email, password } = req.body;
            const result = await this.adminService.login({
                email,
                password,
            });
            sendJsonResponse(res, 200, 'Login successful', result);
        },
    );

    private getUsers = asyncHandler(
        async (req: Request, res: Response): Promise<void> => {
            const users = await this.adminService.fetchAllUsers();

            sendJsonResponse(res, 200, 'Users retrive succesful', {
                data: users,
            });
        },
    );

    private getUsersById = asyncHandler(
        async (req: Request, res: Response): Promise<void> => {
            const { id } = req.params;
            const user = await this.adminService.fetchUserById(id);

            sendJsonResponse(res, 200, 'Users retrive by id succesful', {
                data: user,
            });
        },
    );

    public deleteUserById = asyncHandler(
        async (req: Request, res: Response): Promise<void> => {
            const { id } = req.params;
            const deletedUser = await this.adminService.deleteUser(id);

            sendJsonResponse(res, 200, 'User deleted successfully');
        },
    );

    private getRestaurants = asyncHandler(
        async (req: Request, res: Response): Promise<void> => {
            const restaurants = await this.adminService.fetchAllRestaurants();

            sendJsonResponse(res, 200, 'Restaurants retrive succesful', {
                data: restaurants,
            });
        },
    );

    private getRestaurantsById = asyncHandler(
        async (req: Request, res: Response): Promise<void> => {
            const { id } = req.params;
            const restaurant = await this.adminService.fetchRestaurantById(id);

            sendJsonResponse(res, 200, 'Restaurant retrive by id succesful', {
                data: restaurant,
            });
        },
    );

    public deleteRestaurantById = asyncHandler(
        async (req: Request, res: Response): Promise<void> => {
            const { id } = req.params;
            const deletedRestaurant =
                await this.adminService.deleteRestaurant(id);

            sendJsonResponse(res, 200, 'Restaurant deleted successfully');
        },
    );

    private getRiders = asyncHandler(
        async (req: Request, res: Response): Promise<void> => {
            const riders = await this.adminService.fetchAllRiders();

            sendJsonResponse(res, 200, 'Riders retrive succesful', {
                data: riders,
            });
        },
    );

    private getRidersById = asyncHandler(
        async (req: Request, res: Response): Promise<void> => {
            const { id } = req.params;
            const rider = await this.adminService.fetchRiderById(id);

            sendJsonResponse(res, 200, 'Riders retrive by id succesful', {
                data: rider,
            });
        },
    );

    public deleteRiderById = asyncHandler(
        async (req: Request, res: Response): Promise<void> => {
            const { id } = req.params;
            const deletedRider = await this.adminService.deleteRider(id);

            sendJsonResponse(res, 200, 'Rider deleted successfully');
        },
    );
}
