import { z } from 'zod';

const paymentSchema = z.object({
    orderId: z.string().min(1, 'Order Id is required'),
    payment_method: z.enum(['cash_on_delivery', 'transfer'], {
        errorMap: () => ({
            message:
                "Payment method must be either 'cash_on_delivery' or 'transfer'",
        }),
    }),
});

export default {
    paymentSchema,
};
