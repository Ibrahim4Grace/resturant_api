import { z } from 'zod';
const settingSchema = z.object({
    tax_rate: z.number().min(0, 'Tax is required'),
    delivery_fee: z.number().min(0, 'Delivery fee is required'),
});

export default {
    settingSchema,
};
