import { Schema, model } from 'mongoose';
import { ISetting } from '../setting/setting-interface';

const SettingSchema = new Schema<ISetting>(
    {
        key: {
            type: String,
            required: true,
            unique: true,
            trim: true,
        },
        value: {
            type: String,
            required: true,
        },
        description: {
            type: String,
        },
    },
    { timestamps: true },
);

export default model<ISetting>('Setting', SettingSchema);
