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
        const { tax_rate, delivery_fee } = reqBody;
        const settings = await SettingModel.findOneAndUpdate(
            {},
            { tax_rate, delivery_fee },
            { new: true, upsert: true },
        );

        if (!settings) {
            throw new ResourceNotFound('Settings not found');
        }

        return settingData(settings);
    }
}
