import { Router, Request, Response, NextFunction } from "express";
import Controller from "@/utils/interfaces/controller.interface";
import validate from "@/resources/admin/admin-validation";
import { AdminService } from "@/resources/admin/admin-service";
import { authMiddleware } from "@/middlewares/index";
import {
    validateData,
    sendJsonResponse,
    asyncHandler,
} from "@/middlewares/index";

export default class AdminController implements Controller {
    public path = "/admins";
    public router = Router();
    private adminService = new AdminService();

    constructor() {
        this.initializeRoutes();
    }

    private initializeRoutes(): void {
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
            `${this.path}/get-admins`,
            authMiddleware,
            //    checkRole(['admin']), // check role
            asyncHandler(this.getAdmins),
        );
    }

    private register = async (
        req: Request,
        res: Response,
        next: NextFunction,
    ): Promise<void> => {
        const { name, email, password, role } = req.body;
        const result = await this.adminService.register({
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
        const result = await this.adminService.login({
            email,
            password,
        });
        sendJsonResponse(res, 200, "Login successful", result);
    };

    private getAdmins = async (
        req: Request,
        res: Response,
        next: NextFunction,
    ): Promise<void> => {
        const admins = await this.adminService.getAdmins();
        sendJsonResponse(res, 200, "Admins retrieved successfully", admins);
    };
}
