"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const admin_validation_1 = __importDefault(require("@/resources/admin/admin-validation"));
const admin_service_1 = require("@/resources/admin/admin-service");
const index_1 = require("@/utils/index");
const admin_model_1 = __importDefault(require("@/resources/admin/admin-model"));
const index_2 = require("@/middlewares/index");
class AdminController {
    constructor() {
        this.authPath = '/auth/admins';
        this.path = '/admins';
        this.router = (0, express_1.Router)();
        this.adminService = new admin_service_1.AdminService();
        this.register = (0, index_2.asyncHandler)(async (req, res) => {
            const { name, email, password, phone, street, city, state } = req.body;
            const address = { street, city, state };
            const registrationData = {
                name,
                email,
                password,
                phone,
                address,
            };
            const result = await this.adminService.register(registrationData);
            (0, index_2.sendJsonResponse)(res, 201, 'Registration initiated. Please verify your email with the OTP sent.', result);
        });
        this.registrationOTP = (0, index_2.asyncHandler)(async (req, res) => {
            const { otp } = req.body;
            const authHeader = req.headers.authorization;
            if (!authHeader || !authHeader.startsWith('Bearer ')) {
                throw new index_2.BadRequest('Authorization token is required');
            }
            if (!otp) {
                throw new index_2.BadRequest('OTP code is required');
            }
            const token = authHeader.split(' ')[1];
            const decoded = await index_1.TokenService.verifyEmailToken(token);
            const user = await this.adminService.verifyRegistrationOTP(decoded.userId.toString(), otp);
            (0, index_2.sendJsonResponse)(res, 200, 'Email verified successfully. You can now log in.');
        });
        this.forgotPassword = (0, index_2.asyncHandler)(async (req, res) => {
            const { email } = req.body;
            const resetToken = await this.adminService.forgotPassword(email);
            (0, index_2.sendJsonResponse)(res, 200, 'Reset token generated and OTP sent to your email.', resetToken);
        });
        this.resetPasswordOTP = (0, index_2.asyncHandler)(async (req, res) => {
            const authHeader = req.headers.authorization;
            if (!authHeader || !authHeader.startsWith('Bearer ')) {
                throw new index_2.BadRequest('Authorization token is required');
            }
            const resetToken = authHeader.split(' ')[1];
            const { otp } = req.body;
            if (!otp) {
                throw new index_2.BadRequest('OTP is required');
            }
            await this.adminService.verifyResetPasswordOTP(resetToken, otp);
            (0, index_2.sendJsonResponse)(res, 200, 'OTP verified successfully. You can now reset your password.');
        });
        this.resetPassword = (0, index_2.asyncHandler)(async (req, res) => {
            const authHeader = req.headers.authorization;
            if (!authHeader || !authHeader.startsWith('Bearer ')) {
                throw new index_2.BadRequest('Authorization token is required');
            }
            const resetToken = authHeader.split(' ')[1];
            const { newPassword } = req.body;
            if (!newPassword) {
                throw new index_2.BadRequest('New password is required');
            }
            await this.adminService.resetPassword(resetToken, newPassword);
            (0, index_2.sendJsonResponse)(res, 200, 'Password reset successfully.');
        });
        this.login = (0, index_2.asyncHandler)(async (req, res) => {
            const { email, password } = req.body;
            const result = await this.adminService.login({
                email,
                password,
            });
            (0, index_2.sendJsonResponse)(res, 200, 'Login successful', result);
        });
        this.getAdmins = (0, index_2.asyncHandler)(async (req, res) => {
            const admins = await this.adminService.fetchAllAdmins(req, res);
            (0, index_2.sendJsonResponse)(res, 200, 'Admins retrive succesful', admins);
        });
        this.getAdminsById = (0, index_2.asyncHandler)(async (req, res) => {
            const { id } = req.params;
            const admin = await this.adminService.fetchAdminsById(id);
            (0, index_2.sendJsonResponse)(res, 200, 'Admin retrive by id succesful', admin);
        });
        this.deleteAdminById = (0, index_2.asyncHandler)(async (req, res) => {
            const { id } = req.params;
            const deletedAdmin = await this.adminService.deletedAdmin(id);
            (0, index_2.sendJsonResponse)(res, 200, 'Admin deleted successfully');
        });
        this.getUsers = (0, index_2.asyncHandler)(async (req, res) => {
            const users = await this.adminService.fetchAllUsers(req, res);
            (0, index_2.sendJsonResponse)(res, 200, 'Users retrive succesful', users);
        });
        this.getUsersById = (0, index_2.asyncHandler)(async (req, res) => {
            const { id } = req.params;
            const user = await this.adminService.fetchUserById(id);
            (0, index_2.sendJsonResponse)(res, 200, 'Users retrive by id succesful', user);
        });
        this.deleteUserById = (0, index_2.asyncHandler)(async (req, res) => {
            const { id } = req.params;
            const deletedUser = await this.adminService.deleteUser(id);
            (0, index_2.sendJsonResponse)(res, 200, 'User deleted successfully');
        });
        this.getRestaurants = (0, index_2.asyncHandler)(async (req, res) => {
            const restaurants = await this.adminService.fetchAllRestaurants(req, res);
            (0, index_2.sendJsonResponse)(res, 200, 'Restaurants retrive succesful', restaurants);
        });
        this.getRestaurantsById = (0, index_2.asyncHandler)(async (req, res) => {
            const { id } = req.params;
            const restaurant = await this.adminService.fetchRestaurantById(id);
            (0, index_2.sendJsonResponse)(res, 200, 'Restaurant retrive by id succesful', restaurant);
        });
        this.deleteRestaurantById = (0, index_2.asyncHandler)(async (req, res) => {
            const { id } = req.params;
            const deletedRestaurant = await this.adminService.deleteRestaurant(id);
            (0, index_2.sendJsonResponse)(res, 200, 'Restaurant deleted successfully');
        });
        this.getRiders = (0, index_2.asyncHandler)(async (req, res) => {
            const riders = await this.adminService.fetchAllRiders(req, res);
            (0, index_2.sendJsonResponse)(res, 200, 'Riders retrive succesful', riders);
        });
        this.getRidersById = (0, index_2.asyncHandler)(async (req, res) => {
            const { id } = req.params;
            const rider = await this.adminService.fetchRiderById(id);
            (0, index_2.sendJsonResponse)(res, 200, 'Riders retrive by id succesful', rider);
        });
        this.deleteRiderById = (0, index_2.asyncHandler)(async (req, res) => {
            const { id } = req.params;
            const deletedRider = await this.adminService.deleteRider(id);
            (0, index_2.sendJsonResponse)(res, 200, 'Rider deleted successfully');
        });
        this.getOrders = (0, index_2.asyncHandler)(async (req, res) => {
            const orders = await this.adminService.fetchAllOrders(req, res);
            (0, index_2.sendJsonResponse)(res, 200, 'Orders retrive succesful', orders);
        });
        this.getOrdersById = (0, index_2.asyncHandler)(async (req, res) => {
            const { id } = req.params;
            const order = await this.adminService.fetchOrdersById(id);
            (0, index_2.sendJsonResponse)(res, 200, 'Orders retrive by id succesful', order);
        });
        this.deleteOrderById = (0, index_2.asyncHandler)(async (req, res) => {
            const { id } = req.params;
            const deletedOrder = await this.adminService.deleteOrder(id);
            (0, index_2.sendJsonResponse)(res, 200, 'Order deleted successfully');
        });
        this.initializeRoutes();
    }
    initializeRoutes() {
        this.router.post(`${this.authPath}/register`, (0, index_2.validateData)(admin_validation_1.default.register), this.register);
        this.router.post(`${this.authPath}/verify-otp`, (0, index_2.validateData)(admin_validation_1.default.verifyOtp), this.registrationOTP);
        this.router.post(`${this.authPath}/forgot`, (0, index_2.validateData)(admin_validation_1.default.forgetPwd), this.forgotPassword);
        this.router.post(`${this.authPath}/password/verify-otp`, (0, index_2.validateData)(admin_validation_1.default.verifyOtp), this.resetPasswordOTP);
        this.router.post(`${this.authPath}/password/reset`, (0, index_2.validateData)(admin_validation_1.default.resetPassword), this.resetPassword);
        this.router.post(`${this.authPath}/login`, (0, index_2.validateData)(admin_validation_1.default.login), this.login);
        this.router.get(`${this.path}`, (0, index_2.authMiddleware)(), (0, index_2.authorization)(admin_model_1.default, ['admin']), this.getAdmins);
        this.router.get(`${this.path}/admin/:id`, (0, index_2.authMiddleware)(), (0, index_2.authorization)(admin_model_1.default, ['admin']), this.getAdminsById);
        this.router.delete(`${this.path}/admin/:id`, (0, index_2.authMiddleware)(), (0, index_2.authorization)(admin_model_1.default, ['admin']), this.deleteAdminById);
        this.router.get(`${this.path}/users`, (0, index_2.authMiddleware)(), (0, index_2.authorization)(admin_model_1.default, ['admin']), this.getUsers);
        this.router.get(`${this.path}/user/:id`, (0, index_2.authMiddleware)(), (0, index_2.authorization)(admin_model_1.default, ['admin']), this.getUsersById);
        this.router.delete(`${this.path}/user/:id`, (0, index_2.authMiddleware)(), (0, index_2.authorization)(admin_model_1.default, ['admin']), this.deleteUserById);
        this.router.get(`${this.path}/restaurants`, (0, index_2.authMiddleware)(), (0, index_2.authorization)(admin_model_1.default, ['admin']), this.getRestaurants);
        this.router.get(`${this.path}/restaurant/:id`, (0, index_2.authMiddleware)(), (0, index_2.authorization)(admin_model_1.default, ['admin']), this.getRestaurantsById);
        this.router.delete(`${this.path}/restaurant/:id`, (0, index_2.authMiddleware)(), (0, index_2.authorization)(admin_model_1.default, ['admin']), this.deleteRestaurantById);
        this.router.get(`${this.path}/riders`, (0, index_2.authMiddleware)(), (0, index_2.authorization)(admin_model_1.default, ['admin']), this.getRiders);
        this.router.get(`${this.path}/rider/:id`, (0, index_2.authMiddleware)(), (0, index_2.authorization)(admin_model_1.default, ['admin']), this.getRidersById);
        this.router.delete(`${this.path}/rider/:id`, (0, index_2.authMiddleware)(), (0, index_2.authorization)(admin_model_1.default, ['admin']), this.deleteRiderById);
        this.router.get(`${this.path}/orders`, (0, index_2.authMiddleware)(), (0, index_2.authorization)(admin_model_1.default, ['admin']), this.getOrders);
        this.router.get(`${this.path}/order/:id`, (0, index_2.authMiddleware)(), (0, index_2.authorization)(admin_model_1.default, ['admin']), this.getOrdersById);
        this.router.delete(`${this.path}/order/:id`, (0, index_2.authMiddleware)(), (0, index_2.authorization)(admin_model_1.default, ['admin']), this.deleteOrderById);
    }
}
exports.default = AdminController;
//# sourceMappingURL=admin-controller.js.map