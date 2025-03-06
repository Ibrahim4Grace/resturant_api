import SettingModel from '../settings/setting-model';
import { ResourceNotFound, BadRequest } from '../../middlewares/index';
import {
    ISetting,
    ICreateSetting,
    IUpdateSetting,
} from '../settings/setting-interface';

export function settingData(setting: ISetting): Partial<ISetting> {
    return {
        _id: setting._id,
        tax_rate: setting.tax_rate,
        delivery_fee: setting.delivery_fee,
        app_commission: setting.app_commission,
        rider_commission: setting.rider_commission,
        restaurant_commission: setting.restaurant_commission,
        createdAt: setting.createdAt,
        updatedAt: setting.updatedAt,
    };
}

export class SettingsService {
    public async getSettings(): Promise<Partial<ISetting>> {
        const settings = await SettingModel.findOne();
        if (!settings) throw new ResourceNotFound('Settings not found');
        return settingData(settings);
    }

    public async createSettings(
        createSettingData: ICreateSetting,
    ): Promise<Partial<ISetting>> {
        const existingSettings = await SettingModel.findOne();
        if (existingSettings) {
            throw new BadRequest(
                'Settings already exist. Use the update endpoint instead.',
            );
        }

        const settings = await SettingModel.create({
            ...createSettingData,
        });

        await settings.save();
        return settingData(settings);
    }

    public async updateSettings(
        reqBody: IUpdateSetting,
    ): Promise<Partial<ISetting>> {
        const {
            tax_rate,
            delivery_fee,
            app_commission,
            rider_commission,
            restaurant_commission,
        } = reqBody;
        const settings = await SettingModel.findOneAndUpdate(
            {},
            {
                tax_rate,
                delivery_fee,
                app_commission,
                rider_commission,
                restaurant_commission,
            },
            { new: true, upsert: true },
        );

        if (!settings) {
            throw new ResourceNotFound('Settings not found');
        }

        return settingData(settings);
    }
}
