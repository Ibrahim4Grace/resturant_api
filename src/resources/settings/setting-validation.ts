import { z } from 'zod';
const settingSchema = z.object({
    tax_rate: z.number().min(0, 'Tax is required'),
    delivery_fee: z.number().min(0, 'Delivery fee is required'),
    app_commission: z.number().min(0, 'App commission is required'),
    rider_commission: z.number().min(0, 'Rider commission is required'),
    restaurant_commission: z
        .number()
        .min(0, 'Restaurant commission is required'),
    dispute_window_hours: z.number().min(0, 'Dispute window hours is required'),
});

export default {
    settingSchema,
};
