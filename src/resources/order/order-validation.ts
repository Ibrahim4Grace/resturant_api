import { z } from 'zod';
const orderSchema = z.object({
    items: z.array(
        z.object({
            menuId: z.string(),
            quantity: z.number().min(1),
        }),
    ),
    delivery_address: z.string().min(0, 'Delivery address is required'),
    restaurantId: z.string(),
    payment_method: z.enum(['cash_on_delivery', 'transfer'], {
        errorMap: () => ({
            message:
                "Payment method must be either 'cash_on_delivery' or 'transfer'",
        }),
    }),
});

const orderStatusSchema = z.object({
    status: z.enum([
        'pending',
        'processing',
        'ready_for_pickup',
        'shipped',
        'delivered',
        'cancelled',
    ]),
});

export default {
    orderSchema,
    orderStatusSchema,
};
