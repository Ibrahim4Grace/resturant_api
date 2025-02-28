import SettingModel from '../setting/setting-model';
import { ResourceNotFound } from '../../middlewares/index';

export default class SettingsHelper {
    private setting = SettingModel;
    // Initialize default settings if they don't exist
    public static async initializeDefaultSettings(): Promise<void> {
        const defaultSettings = [
            {
                key: 'TAX_RATE',
                value: '0.05',
                description: 'Tax rate as a decimal (e.g., 0.05 for 5%)',
            },
            {
                key: 'DELIVERY_FEE',
                value: '2.99',
                description: 'Base delivery fee in naira',
            },
        ];

        for (const setting of defaultSettings) {
            await this.setting.findOneAndUpdate({ key: setting.key }, setting, {
                upsert: true,
            });
        }
    }

    // Get a setting value as string
    public static async getSetting(key: string): Promise<string> {
        const setting = await Setting.findOne({ key });
        if (!setting) {
            throw new ResourceNotFound(`Setting ${key} not found`);
        }
        return setting.value;
    }

    // Get a setting value as number
    public static async getSettingAsNumber(key: string): Promise<number> {
        const value = await this.getSetting(key);
        return parseFloat(value);
    }

    // Get multiple settings at once
    public static async getMultipleSettings(
        keys: string[],
    ): Promise<Record<string, string>> {
        const settings = await Setting.find({ key: { $in: keys } });
        return settings.reduce((acc, setting) => {
            acc[setting.key] = setting.value;
            return acc;
        }, {});
    }
}
