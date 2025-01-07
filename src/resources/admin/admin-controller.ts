import { Router, Request, Response, NextFunction } from "express";
import { Controller } from "@/types/index";
import validate from "@/resources/admin/admin-validation";
import { AdminService } from "@/resources/admin/admin-service";
import { authMiddleware, checkRole } from "@/middlewares/index";
import {
    validateData,
    sendJsonResponse,
    asyncHandler,
    Conflict,
    ResourceNotFound,
    BadRequest,
    Forbidden,
    Unauthorized,
} from "@/middlewares/index";

export default class AdminController implements Controller {
    public path = "/admins";
    public paths = "/auth/admins";
    public router = Router();
    private adminService = new AdminService();

    constructor() {
        this.initializeRoutes();
    }

    private initializeRoutes(): void {
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
            `${this.path}/admins`,
            authMiddleware,
            checkRole(["admin"]),
            asyncHandler(this.getAdmins),
        );
        this.router.get(
            `${this.path}/admins/:id`,
            authMiddleware,
            checkRole(["admin"]),
            asyncHandler(this.getAdminById),
        );
        this.router.put(
            `${this.path}/admins/:id`,
            authMiddleware,
            checkRole(["admin"]),
            asyncHandler(this.updateAdminById),
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

    private getAdminById = async (
        req: Request,
        res: Response,
        next: NextFunction,
    ): Promise<void> => {
        const { id } = req.params;
        const admin = await this.adminService.getAdminById(id);

        if (!admin) {
            throw new ResourceNotFound("Admin not found");
        }

        sendJsonResponse(res, 200, "Admin retrieved successfully", admin);
    };

    private updateAdminById = async (
        req: Request,
        res: Response,
        next: NextFunction,
    ): Promise<void> => {
        const { id } = req.params;
        const data = req.body;
        const updatedAdmin = await this.adminService.updateAdminById(id, data);

        if (!updatedAdmin) {
            throw new ResourceNotFound("Admin not found or update failed");
        }

        sendJsonResponse(
            res,
            200,
            "Admin data updated successfully",
            updatedAdmin,
        );
    };
}
