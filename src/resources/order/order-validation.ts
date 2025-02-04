import { z } from 'zod';
const orderSchema = z.object({
    items: z.array(
        z.object({
            menuId: z.string(),
            quantity: z.number().min(1),
        }),
    ),
    address: z.string().min(0, 'Delivery address is required'),
    restaurantId: z.string(),
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

const assignRiderSchema = z.object({
    riderId: z.string(),
});

export default {
    orderSchema,
    orderStatusSchema,
    assignRiderSchema,
};
