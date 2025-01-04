import { Router, Request, Response, NextFunction } from "express";
import { Controller } from "@/utils/interfaces/controller.interface";
import validate from "@/resources/user/user-validation";
import { UserService } from "@/resources/user/user-service";
import { authMiddleware } from "@/middlewares/index";
import {
    validateData,
    sendJsonResponse,
    asyncHandler,
    ResourceNotFound,
    BadRequest,
} from "@/middlewares/index";

export default class UserController implements Controller {
    public paths = "/auth/users";
    public path = "/users";
    public router = Router();
    private userService = new UserService();

    constructor() {
        this.initializeRoutes();
    }

    private initializeRoutes(): void {
        this.router.post(
            `${this.paths}/password/forgot`,
            validateData(validate.register),
            asyncHandler(this.handleForgotPassword),
        );
        this.router.post(
            `${this.paths}/password/verify-otp`,
            validateData(validate.register),
            asyncHandler(this.verifyOTP),
        );
        this.router.post(
            `${this.paths}/password/reset`,
            validateData(validate.register),
            asyncHandler(this.resetPassword),
        );
        this.router.post(
            `${this.paths}/register`,
            validateData(validate.register),
            asyncHandler(this.register),
        );
        this.router.post(
            `${this.paths}/login`,
            validateData(validate.login),
            asyncHandler(this.login),
        );
        this.router.get(
            `${this.path}`,
            authMiddleware,
            asyncHandler(this.getUsers),
        );
        this.router.get(
            `${this.path}/:id`,
            authMiddleware,
            asyncHandler(this.getUserById),
        );
        this.router.put(
            `${this.path}/:id`,
            authMiddleware,
            asyncHandler(this.updateUserById),
        );
    }

    private handleForgotPassword = async (
        req: Request,
        res: Response,
        next: NextFunction,
    ): Promise<void> => {
        const { email } = req.body;

        if (!email) {
            throw new BadRequest("Email is required");
        }

        const resetToken = await this.userService.handleForgotPassword(email);
        sendJsonResponse(
            res,
            200,
            "Reset token generated and OTP sent to your email.",
            resetToken,
        );
    };

    private verifyOTP = async (
        req: Request,
        res: Response,
        next: NextFunction,
    ): Promise<void> => {
        const { resetToken, otp } = req.body;

        if (!resetToken || !otp) {
            throw new BadRequest("Reset token and OTP are required");
        }

        const isValid = await this.userService.verifyOTP(resetToken, otp);

        if (isValid) {
            sendJsonResponse(
                res,
                200,
                "OTP verified successfully.",
                resetToken,
            );
        } else {
            throw new BadRequest("Invalid OTP.");
        }
    };

    private resetPassword = async (
        req: Request,
        res: Response,
        next: NextFunction,
    ): Promise<void> => {
        const { resetToken, newPassword } = req.body;

        if (!resetToken || !newPassword) {
            throw new BadRequest("Reset token and new password are required");
        }

        await this.userService.resetPassword(resetToken, newPassword);
        sendJsonResponse(res, 200, "Password reset successfully.");
    };

    private register = async (
        req: Request,
        res: Response,
        next: NextFunction,
    ): Promise<void> => {
        const { name, email, password, role } = req.body;
        const result = await this.userService.register({
            name,
            email,
            password,
            role,
        });
        sendJsonResponse(res, 201, "Registration successful", result);
    };

    private login = async (
        req: Request,
        res: Response,
        next: NextFunction,
    ): Promise<void> => {
        const { email, password } = req.body;
        const result = await this.userService.login({
            email,
            password,
        });
        sendJsonResponse(res, 200, "Login successful", result);
    };

    private getUsers = async (
        req: Request,
        res: Response,
        next: NextFunction,
    ): Promise<void> => {
        const users = await this.userService.getUsers();
        sendJsonResponse(res, 200, "Users retrieved successfully", users);
    };

    private getUserById = async (
        req: Request,
        res: Response,
        next: NextFunction,
    ): Promise<void> => {
        const { id } = req.params;
        const user = await this.userService.getUserById(id);

        if (!user) {
            throw new ResourceNotFound("User not found");
        }

        sendJsonResponse(res, 200, "User retrieved successfully", user);
    };

    private updateUserById = async (
        req: Request,
        res: Response,
        next: NextFunction,
    ): Promise<void> => {
        const { id } = req.params;
        const data = req.body;
        const updatedUser = await this.userService.updateUserById(id, data);

        if (!updatedUser) {
            throw new ResourceNotFound("User not found or update failed");
        }

        sendJsonResponse(
            res,
            200,
            "User data updated successfully",
            updatedUser,
        );
    };
}
