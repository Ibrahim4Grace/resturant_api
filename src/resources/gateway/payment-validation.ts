import { z } from 'zod';

const paymentSchema = z.object({
    orderId: z.string().min(1, 'Order Id is required'),
    paymentMethod: z.string().min(1, 'Payment method is required'),
});

export default {
    paymentSchema,
};
