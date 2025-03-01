import { Schema, model } from 'mongoose';
import { ISetting } from '../settings/setting-interface';

const SettingSchema = new Schema<ISetting>(
    {
        tax_rate: { type: Number, default: 0.05 }, // 5%
        delivery_fee: { type: Number, default: 1000 },
    },
    { timestamps: true },
);

export default model<ISetting>('Setting', SettingSchema);
