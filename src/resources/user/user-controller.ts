import { Router, Request, Response, NextFunction } from "express";
import Controller from "@/utils/interfaces/controller.interface";
import validate from "@/resources/user/user-validation";
import { UserService } from "@/resources/user/user-service";
import { authMiddleware } from "@/middlewares/index";
import {
    validateData,
    sendJsonResponse,
    asyncHandler,
} from "@/middlewares/index";

export default class UserController implements Controller {
    public path = "/users";
    public router = Router();
    private userService = new UserService();

    constructor() {
        this.initializeRoutes();
    }

    private initializeRoutes(): void {
        this.router.post(
            `${this.path}/contact-us`,
            validateData(validate.contact),
            asyncHandler(this.contact),
        );
        this.router.post(
            `${this.path}/register`,
            validateData(validate.register),
            asyncHandler(this.register),
        );
        this.router.post(
            `${this.path}/login`,
            validateData(validate.login),
            asyncHandler(this.login),
        );
        this.router.get(
            `${this.path}/get-users`,
            authMiddleware,
            //    checkRole(['admin']), // check role
            asyncHandler(this.getUsers),
        );
    }

    private contact = async (
        req: Request,
        res: Response,
        next: NextFunction,
    ): Promise<void> => {
        const { first_name, last_name, number, email, subject, message } =
            req.body;
        const result = await this.userService.contact({
            first_name,
            last_name,
            number,
            email,
            subject,
            message,
        });
        sendJsonResponse(res, 201, "Message sent successful");
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
}
