import { Router, Request, Response } from 'express';
import { Controller } from '../../types/index';
import validate from '../admin/admin-validation';
import { AdminService } from '../admin/admin-service';
import { TokenService } from '../../utils/index';
import AdminModel from '../admin/admin-model';
import { RegisterAdminto, Address } from '../admin/admin-interface';
import {
    validateData,
    sendJsonResponse,
    asyncHandler,
    BadRequest,
    authMiddleware,
    authorization,
} from '../../middlewares/index';

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
            `${this.path}`,
            authMiddleware(),
            authorization(AdminModel, ['admin']),
            this.getAdmins,
        );
        this.router.get(
            `${this.path}/admin/:id`,
            authMiddleware(),
            authorization(AdminModel, ['admin']),
            this.getAdminsById,
        );
        this.router.delete(
            `${this.path}/admin/:id`,
            authMiddleware(),
            authorization(AdminModel, ['admin']),
            this.deleteAdminById,
        );
        this.router.get(
            `${this.path}/users`,
            authMiddleware(),
            authorization(AdminModel, ['admin']),
            this.getUsers,
        );
        this.router.get(
            `${this.path}/user/:id`,
            authMiddleware(),
            authorization(AdminModel, ['admin']),
            this.getUsersById,
        );
        this.router.delete(
            `${this.path}/user/:id`,
            authMiddleware(),
            authorization(AdminModel, ['admin']),
            this.deleteUserById,
        );

        this.router.get(
            `${this.path}/restaurants`,
            authMiddleware(),
            authorization(AdminModel, ['admin']),
            this.getRestaurants,
        );
        this.router.get(
            `${this.path}/restaurant/:id`,
            authMiddleware(),
            authorization(AdminModel, ['admin']),
            this.getRestaurantsById,
        );
        this.router.delete(
            `${this.path}/restaurant/:id`,
            authMiddleware(),
            authorization(AdminModel, ['admin']),
            this.deleteRestaurantById,
        );
        this.router.get(
            `${this.path}/riders`,
            authMiddleware(),
            authorization(AdminModel, ['admin']),
            this.getRiders,
        );
        this.router.get(
            `${this.path}/rider/:id`,
            authMiddleware(),
            authorization(AdminModel, ['admin']),
            this.getRidersById,
        );
        this.router.delete(
            `${this.path}/rider/:id`,
            authMiddleware(),
            authorization(AdminModel, ['admin']),
            this.deleteRiderById,
        );

        this.router.get(
            `${this.path}/orders`,
            authMiddleware(),
            authorization(AdminModel, ['admin']),
            this.getOrders,
        );
        this.router.get(
            `${this.path}/order/:id`,
            authMiddleware(),
            authorization(AdminModel, ['admin']),
            this.getOrdersById,
        );
        this.router.delete(
            `${this.path}/order/:id`,
            authMiddleware(),
            authorization(AdminModel, ['admin']),
            this.deleteOrderById,
        );
    }

    private register = asyncHandler(
        async (req: Request, res: Response): Promise<void> => {
            const { name, email, password, phone, street, city, state } =
                req.body;

            const address: Address = { street, city, state };

            const registrationData: RegisterAdminto = {
                name,
                email,
                password,
                phone,
                address,
            };

            const result = await this.adminService.register(registrationData);
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

    private getAdmins = asyncHandler(
        async (req: Request, res: Response): Promise<void> => {
            const admins = await this.adminService.fetchAllAdmins(req, res);

            sendJsonResponse(res, 200, 'Admins retrive succesful', admins);
        },
    );

    private getAdminsById = asyncHandler(
        async (req: Request, res: Response): Promise<void> => {
            const { id } = req.params;
            const admin = await this.adminService.fetchAdminsById(id);

            sendJsonResponse(res, 200, 'Admin retrive by id succesful', admin);
        },
    );

    public deleteAdminById = asyncHandler(
        async (req: Request, res: Response): Promise<void> => {
            const { id } = req.params;
            const deletedAdmin = await this.adminService.deletedAdmin(id);

            sendJsonResponse(res, 200, 'Admin deleted successfully');
        },
    );

    private getUsers = asyncHandler(
        async (req: Request, res: Response): Promise<void> => {
            const users = await this.adminService.fetchAllUsers(req, res);

            sendJsonResponse(res, 200, 'Users retrive succesful', users);
        },
    );

    private getUsersById = asyncHandler(
        async (req: Request, res: Response): Promise<void> => {
            const { id } = req.params;
            const user = await this.adminService.fetchUserById(id);

            sendJsonResponse(res, 200, 'Users retrive by id succesful', user);
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
            const restaurants = await this.adminService.fetchAllRestaurants(
                req,
                res,
            );

            sendJsonResponse(
                res,
                200,
                'Restaurants retrive succesful',
                restaurants,
            );
        },
    );

    private getRestaurantsById = asyncHandler(
        async (req: Request, res: Response): Promise<void> => {
            const { id } = req.params;
            const restaurant = await this.adminService.fetchRestaurantById(id);

            sendJsonResponse(
                res,
                200,
                'Restaurant retrive by id succesful',
                restaurant,
            );
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
            const riders = await this.adminService.fetchAllRiders(req, res);

            sendJsonResponse(res, 200, 'Riders retrive succesful', riders);
        },
    );

    private getRidersById = asyncHandler(
        async (req: Request, res: Response): Promise<void> => {
            const { id } = req.params;
            const rider = await this.adminService.fetchRiderById(id);

            sendJsonResponse(res, 200, 'Riders retrive by id succesful', rider);
        },
    );

    public deleteRiderById = asyncHandler(
        async (req: Request, res: Response): Promise<void> => {
            const { id } = req.params;
            const deletedRider = await this.adminService.deleteRider(id);

            sendJsonResponse(res, 200, 'Rider deleted successfully');
        },
    );

    private getOrders = asyncHandler(
        async (req: Request, res: Response): Promise<void> => {
            const orders = await this.adminService.fetchAllOrders(req, res);

            sendJsonResponse(res, 200, 'Orders retrive succesful', orders);
        },
    );

    private getOrdersById = asyncHandler(
        async (req: Request, res: Response): Promise<void> => {
            const { id } = req.params;
            const order = await this.adminService.fetchOrdersById(id);

            sendJsonResponse(res, 200, 'Orders retrive by id succesful', order);
        },
    );

    public deleteOrderById = asyncHandler(
        async (req: Request, res: Response): Promise<void> => {
            const { id } = req.params;
            const deletedOrder = await this.adminService.deleteOrder(id);

            sendJsonResponse(res, 200, 'Order deleted successfully');
        },
    );
}
