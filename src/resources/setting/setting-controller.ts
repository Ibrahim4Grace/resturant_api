import { Router, Request, Response } from 'express';
import { Controller } from '../../types/index';
import validate from '../admin/admin-validation';
import { SettingService } from '../setting/setting-service';
import Setting from '../setting/setting-model';
import AdminModel from '../admin/admin-model';
import {
    ResourceNotFound,
    authMiddleware,
    authorization,
} from '../../middlewares/index';

export default class SettingsController implements Controller {
    public path = '/admin';
    public router = Router();
    private settingService = new SettingService();
    constructor() {
        this.initializeRoutes();
    }

    private initializeRoutes(): void {
        this.router.get(
            `${this.path}`,
            authMiddleware(),
            authorization(AdminModel, ['admin']),
            this.getSettings,
        );
        this.router.get(
            `${this.path}/:key`,
            authMiddleware(),
            authorization(AdminModel, ['admin']),
            this.getSetting,
        );
        this.router.put(
            `${this.path}`,
            authMiddleware(),
            authorization(AdminModel, ['admin']),
            this.updateSettings,
        );
        this.router.put(
            `${this.path}/:key`,
            authMiddleware(),
            authorization(AdminModel, ['admin']),
            this.updateSetting,
        );
    }

    // Get all settings
    private async getSettings(req: Request, res: Response): Promise<void> {
        try {
            const settings = await Setting.find({});

            // Convert to object with key-value pairs for easier consumption
            const settingsObject = settings.reduce((acc, setting) => {
                acc[setting.key] = {
                    value: setting.value,
                    description: setting.description,
                };
                return acc;
            }, {});

            res.status(200).json({ settings: settingsObject });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    // Get a specific setting
    private async getSetting(req: Request, res: Response): Promise<void> {
        try {
            const { key } = req.params;
            const setting = await Setting.findOne({ key });

            if (!setting) {
                throw new ResourceNotFound(`Setting with key ${key} not found`);
            }

            res.status(200).json({ setting });
        } catch (error) {
            if (error instanceof ResourceNotFound) {
                res.status(404).json({ error: error.message });
            } else {
                res.status(500).json({ error: error.message });
            }
        }
    }

    // Update settings (batch update)
    private async updateSettings(req: Request, res: Response): Promise<void> {
        try {
            const { settings } = req.body;

            if (!settings || !Array.isArray(settings)) {
                res.status(400).json({ error: 'Invalid settings format' });
                return;
            }

            const updates = await Promise.all(
                settings.map(async ({ key, value, description }) => {
                    const updatedSetting = await Setting.findOneAndUpdate(
                        { key },
                        { value, description },
                        { new: true, upsert: true },
                    );
                    return updatedSetting;
                }),
            );

            res.status(200).json({ success: true, settings: updates });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    // Update a single setting
    private async updateSetting(req: Request, res: Response): Promise<void> {
        try {
            const { key } = req.params;
            const { value, description } = req.body;

            const updatedSetting = await Setting.findOneAndUpdate(
                { key },
                { value, description },
                { new: true, upsert: true },
            );

            res.status(200).json({ success: true, setting: updatedSetting });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
}
