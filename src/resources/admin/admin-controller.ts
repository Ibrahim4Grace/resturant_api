import { Router, Request, Response } from 'express';
import { Controller } from '../../types';
import validate from '../admin/admin-validation';
import { AdminService } from '../admin/admin-service';
import { TokenService } from '../../utils';
import AdminModel from '../admin/admin-model';
import { RegisterAdminto, Address } from '../admin/admin-interface';
import {
    validateData,
    sendJsonResponse,
    asyncHandler,
    BadRequest,
    ResourceNotFound,
    authAndAuthorize,
} from '../../middlewares';

export default class AdminController implements Controller {
    public authPath = '/auth/admin';
    public path = '/admin';
    public paths = '/admins';
    public router = Router();
    private adminService = new AdminService();

    constructor() {
        this.initializeRoutes();
    }

    private initializeRoutes(): void {
        this.router.get(
            `${this.path}/transactions`,
            ...authAndAuthorize(AdminModel, ['admin']),
            this.getAllTransactions,
        );

        this.router.get(
            `${this.path}/orders`,
            ...authAndAuthorize(AdminModel, ['admin']),
            this.getOrders,
        );
        this.router.get(
            `${this.path}/reviews`,
            ...authAndAuthorize(AdminModel, ['admin']),
            this.getReviews,
        );
        this.router.get(
            `${this.path}/menus`,
            ...authAndAuthorize(AdminModel, ['admin']),
            this.getMenus,
        );
        this.router.get(
            `${this.path}/riders`,
            ...authAndAuthorize(AdminModel, ['admin']),
            this.getRiders,
        );
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
            `${this.path}/profile`,
            ...authAndAuthorize(AdminModel, ['admin']),
            this.getProfile,
        );
        this.router.put(
            `${this.path}/profile`,
            ...authAndAuthorize(AdminModel, ['admin']),
            validateData(validate.updateUserSchema),
            this.updateProfile,
        );
        this.router.post(
            `${this.path}/password/reset`,
            ...authAndAuthorize(AdminModel, ['admin']),
            validateData(validate.changePassword),
            this.changePassword,
        );
        this.router.get(
            `${this.paths}`,
            ...authAndAuthorize(AdminModel, ['admin']),
            this.getAdmins,
        );
        this.router.get(
            `${this.path}/users`,
            ...authAndAuthorize(AdminModel, ['admin']),
            this.getUsers,
        );
        this.router.get(
            `${this.path}/restaurants`,
            ...authAndAuthorize(AdminModel, ['admin']),
            this.getRestaurants,
        );
        this.router.get(
            `${this.path}/:id`,
            ...authAndAuthorize(AdminModel, ['admin']),
            this.getAdminsById,
        );
        this.router.delete(
            `${this.path}/:id`,
            ...authAndAuthorize(AdminModel, ['admin']),
            this.deleteAdminById,
        );
        this.router.get(
            `${this.path}/user/:userId`,
            ...authAndAuthorize(AdminModel, ['admin']),
            this.getUsersById,
        );
        this.router.delete(
            `${this.path}/user/:userId`,
            ...authAndAuthorize(AdminModel, ['admin']),
            this.deleteUserById,
        );
        this.router.patch(
            `${this.path}/user/:userId/status`,
            ...authAndAuthorize(AdminModel, ['admin']),
            validateData(validate.lockSchema),
            this.updateUserStatus,
        );
        this.router.get(
            `${this.path}/restaurant/:restaurantId`,
            ...authAndAuthorize(AdminModel, ['admin']),
            this.getRestaurantsById,
        );
        this.router.patch(
            `${this.path}/restaurant/:restaurantId/status`,
            ...authAndAuthorize(AdminModel, ['admin']),
            validateData(validate.statusSchema),
            this.updateRestaurantStatus,
        );
        this.router.delete(
            `${this.path}/restaurant/:restaurantId`,
            ...authAndAuthorize(AdminModel, ['admin']),
            this.deleteRestaurantById,
        );
        this.router.get(
            `${this.path}/restaurant/stats`,
            ...authAndAuthorize(AdminModel, ['admin']),
            this.getRestaurantAnalytics,
        );
        this.router.get(
            `${this.path}/rider/:riderId`,
            ...authAndAuthorize(AdminModel, ['admin']),
            this.getRidersById,
        );
        this.router.delete(
            `${this.path}/rider/:riderId`,
            ...authAndAuthorize(AdminModel, ['admin']),
            this.deleteRiderById,
        );
        this.router.get(
            `${this.path}/order/:orderId`,
            ...authAndAuthorize(AdminModel, ['admin']),
            this.getOrdersById,
        );
        this.router.delete(
            `${this.path}/order/:orderId`,
            ...authAndAuthorize(AdminModel, ['admin']),
            this.deleteOrderById,
        );
        this.router.get(
            `${this.path}/menu/:menuId`,
            ...authAndAuthorize(AdminModel, ['admin']),
            this.getMenuById,
        );
        this.router.delete(
            `${this.path}/menu/:menuId`,
            ...authAndAuthorize(AdminModel, ['admin']),
            this.deleteMenuById,
        );
        this.router.get(
            `${this.path}/restaurant/:restaurantId/menus`,
            ...authAndAuthorize(AdminModel, ['admin']),
            this.getRestaurantMenus,
        );
        this.router.get(
            `${this.path}/review/:reviewId`,
            ...authAndAuthorize(AdminModel, ['admin']),
            this.getReviewById,
        );
        this.router.delete(
            `${this.path}/review/:reviewId`,
            ...authAndAuthorize(AdminModel, ['admin']),
            this.deleteReviewById,
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

    private getProfile = asyncHandler(
        async (req: Request, res: Response): Promise<void> => {
            const adminId = req.currentUser._id;
            if (!adminId) {
                throw new ResourceNotFound('Admin not found');
            }
            const admin = await this.adminService.getAdminById(adminId);

            sendJsonResponse(res, 200, 'Profile retrieved successfully', admin);
        },
    );

    private updateProfile = asyncHandler(
        async (req: Request, res: Response): Promise<void> => {
            const adminId = req.currentUser._id;
            if (!adminId) {
                throw new ResourceNotFound('Admin not found');
            }
            const updateData = req.body;
            const updatedAdmin = await this.adminService.updateAdminById(
                adminId,
                updateData,
            );

            if (!updatedAdmin) {
                throw new ResourceNotFound('Admin not found or update failed');
            }

            sendJsonResponse(
                res,
                200,
                'Profile data updated successfully',
                updatedAdmin,
            );
        },
    );

    private changePassword = asyncHandler(
        async (req: Request, res: Response): Promise<void> => {
            const adminId = req.currentUser._id;
            if (!adminId) {
                throw new ResourceNotFound('Admin not found');
            }
            const { currentPassword, newPassword } = req.body;

            await this.adminService.changeAdminPassword(
                adminId,
                currentPassword,
                newPassword,
            );

            sendJsonResponse(res, 200, 'Password reset successfully');
        },
    );

    private getAdmins = asyncHandler(
        async (req: Request, res: Response): Promise<void> => {
            const adminId = req.currentUser._id;
            if (!adminId) {
                throw new ResourceNotFound('Admin not found');
            }
            const admins = await this.adminService.fetchAllAdmins(req, res);

            sendJsonResponse(res, 200, 'Admins retrive succesful', admins);
        },
    );

    private getAdminsById = asyncHandler(
        async (req: Request, res: Response): Promise<void> => {
            const { id } = req.params;
            const adminId = req.currentUser._id;
            if (!adminId) {
                throw new ResourceNotFound('Admin not found');
            }
            const admin = await this.adminService.fetchAdminsById(id);

            sendJsonResponse(res, 200, 'Admin retrive by id succesful', admin);
        },
    );

    public deleteAdminById = asyncHandler(
        async (req: Request, res: Response): Promise<void> => {
            const { id } = req.params;
            const adminId = req.currentUser._id;
            if (!adminId) {
                throw new ResourceNotFound('Admin not found');
            }
            await this.adminService.deletedAdmin(id);

            sendJsonResponse(res, 200, 'Admin deleted successfully');
        },
    );

    private getUsers = asyncHandler(
        async (req: Request, res: Response): Promise<void> => {
            const adminId = req.currentUser._id;
            if (!adminId) {
                throw new ResourceNotFound('Admin not found');
            }
            const users = await this.adminService.allUsers(req, res);

            sendJsonResponse(res, 200, 'Users retrive succesful', users);
        },
    );

    private getUsersById = asyncHandler(
        async (req: Request, res: Response): Promise<void> => {
            const { userId } = req.params;
            const user = await this.adminService.fetchUserById(userId);

            sendJsonResponse(res, 200, 'Users retrive by id succesful', user);
        },
    );

    public deleteUserById = asyncHandler(
        async (req: Request, res: Response): Promise<void> => {
            const { userId } = req.params;
            const adminId = req.currentUser._id;
            if (!adminId) {
                throw new ResourceNotFound('Admin not found');
            }
            await this.adminService.deleteUser(userId);

            sendJsonResponse(res, 200, 'User deleted successfully');
        },
    );

    private updateUserStatus = asyncHandler(
        async (req: Request, res: Response): Promise<void> => {
            const { userId } = req.params;
            const { isLocked } = req.body;
            const updatedUser = await this.adminService.updateUserStatus(
                userId,
                isLocked,
            );
            const statusMessage = updatedUser.isLocked ? 'locked' : 'unlocked';
            sendJsonResponse(
                res,
                200,
                `User account ${statusMessage} successfully`,
                updatedUser,
            );
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
            const { restaurantId } = req.params;
            const restaurant =
                await this.adminService.fetchRestaurantById(restaurantId);

            sendJsonResponse(
                res,
                200,
                'Restaurant retrive by id succesful',
                restaurant,
            );
        },
    );

    private updateRestaurantStatus = asyncHandler(
        async (req: Request, res: Response): Promise<void> => {
            const adminId = req.currentUser._id;
            if (!adminId) {
                throw new ResourceNotFound('Admin not found');
            }

            const { restaurantId } = req.params;
            const { status } = req.body;

            const updatedUser = await this.adminService.restaurantStatus(
                restaurantId,
                status,
            );

            sendJsonResponse(
                res,
                200,
                'User status updated successfully',
                updatedUser,
            );
        },
    );

    public deleteRestaurantById = asyncHandler(
        async (req: Request, res: Response): Promise<void> => {
            const { restaurantId } = req.params;

            await this.adminService.deleteRestaurant(restaurantId);

            sendJsonResponse(res, 200, 'Restaurant deleted successfully');
        },
    );
    private getRestaurantAnalytics = asyncHandler(
        async (req: Request, res: Response): Promise<void> => {
            const adminId = req.currentUser?._id;
            if (!adminId) {
                throw new ResourceNotFound('Admin not found');
            }

            const analytics = await this.adminService.getRestaurantAnalytics();

            sendJsonResponse(
                res,
                200,
                'Restaurant analytics retrieved successfully',
                analytics,
            );
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
            const { riderId } = req.params;
            const rider = await this.adminService.fetchRiderById(riderId);
            sendJsonResponse(res, 200, 'Riders retrive by id succesful', rider);
        },
    );
    public deleteRiderById = asyncHandler(
        async (req: Request, res: Response): Promise<void> => {
            const { riderId } = req.params;
            await this.adminService.deleteRider(riderId);

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
            const { orderId } = req.params;
            const order = await this.adminService.fetchOrdersById(orderId);
            sendJsonResponse(res, 200, 'Orders retrive by id succesful', order);
        },
    );
    public deleteOrderById = asyncHandler(
        async (req: Request, res: Response): Promise<void> => {
            const { orderId } = req.params;
            await this.adminService.deleteOrder(orderId);

            sendJsonResponse(res, 200, 'Order deleted successfully');
        },
    );
    private getMenus = asyncHandler(
        async (req: Request, res: Response): Promise<void> => {
            const menus = await this.adminService.fetchAllMenus(req, res);
            sendJsonResponse(res, 200, 'Menu retrive succesful', menus);
        },
    );
    private getMenuById = asyncHandler(
        async (req: Request, res: Response): Promise<void> => {
            const { menuId } = req.params;
            const menu = await this.adminService.fetchMenuById(menuId);
            sendJsonResponse(res, 200, 'Menu retrive by id succesful', menu);
        },
    );
    public deleteMenuById = asyncHandler(
        async (req: Request, res: Response): Promise<void> => {
            const { menuId } = req.params;
            await this.adminService.deleteMenu(menuId);
            sendJsonResponse(res, 200, 'Menu deleted successfully');
        },
    );
    private getRestaurantMenus = asyncHandler(
        async (req: Request, res: Response): Promise<void> => {
            const { restaurantId } = req.params;

            const menus = await this.adminService.fetchRestaurantMenus(
                req,
                res,
                restaurantId,
            );

            sendJsonResponse(
                res,
                200,
                'Restaurant menus retrieved successfully',
                menus,
            );
        },
    );
    private getReviews = asyncHandler(
        async (req: Request, res: Response): Promise<void> => {
            const reviews = await this.adminService.getReviews(req, res);
            sendJsonResponse(
                res,
                200,
                'Reviews retrieved successfully',
                reviews,
            );
        },
    );
    private getReviewById = asyncHandler(
        async (req: Request, res: Response): Promise<void> => {
            const { reviewId } = req.params;
            const review = await this.adminService.fetchReviewById(reviewId);
            sendJsonResponse(
                res,
                200,
                'Review retrive by id succesful',
                review,
            );
        },
    );
    private deleteReviewById = asyncHandler(
        async (req: Request, res: Response): Promise<void> => {
            const { reviewId } = req.params;
            await this.adminService.deleteReview(reviewId);
            sendJsonResponse(res, 200, 'Review deleted successfully');
        },
    );

    private getAllTransactions = asyncHandler(
        async (req: Request, res: Response) => {
            const result = await this.adminService.getAllTransactions(
                req.query,
            );
            return sendJsonResponse(
                res,
                200,
                'Transactions retrieved successfully',
                result,
            );
        },
    );
}
