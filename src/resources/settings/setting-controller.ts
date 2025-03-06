import { Router, Request, Response } from 'express';
import { Controller } from '../../types/index';
import { SettingsService } from '../settings/setting-service';
import AdminModel from '../admin/admin-model';
import validate from '../settings/setting-validation';
import {
    authAndAuthorize,
    sendJsonResponse,
    validateData,
    asyncHandler,
    ResourceNotFound,
} from '../../middlewares/index';

export default class SettingsController implements Controller {
    public path = '/admin';
    public router = Router();
    private settingsService = new SettingsService();
    constructor() {
        this.initializeRoutes();
    }

    private initializeRoutes(): void {
        this.router.get(
            `${this.path}/settings/fees`,
            ...authAndAuthorize(AdminModel, ['admin']),
            this.getSettings,
        );
        this.router.put(
            `${this.path}/settings`,
            ...authAndAuthorize(AdminModel, ['admin']),
            validateData(validate.settingSchema),
            this.updateSettings,
        );
        this.router.post(
            `${this.path}/settings`,
            ...authAndAuthorize(AdminModel, ['admin']),
            validateData(validate.settingSchema),
            this.createSettings,
        );
    }

    private getSettings = asyncHandler(
        async (req: Request, res: Response): Promise<void> => {
            const adminId = req.currentUser._id;
            if (!adminId) {
                throw new ResourceNotFound('Admin not found');
            }
            const settings = await this.settingsService.getSettings();
            sendJsonResponse(
                res,
                200,
                'Settings retrive successfully',
                settings,
            );
        },
    );

    private createSettings = asyncHandler(
        async (req: Request, res: Response): Promise<void> => {
            const settings = await this.settingsService.createSettings(
                req.body,
            );
            sendJsonResponse(
                res,
                200,
                'Settings create successfully',
                settings,
            );
        },
    );

    private updateSettings = asyncHandler(
        async (req: Request, res: Response): Promise<void> => {
            const settings = await this.settingsService.updateSettings(
                req.body,
            );
            sendJsonResponse(
                res,
                200,
                'Settings updated successfully',
                settings,
            );
        },
    );
}
