import { z } from 'zod';

const withdrawalSchema = z.object({
    amount: z.number().min(1, 'Amount must be greater than 0'),
    bank_code: z.string().min(1, 'Bank code is required'),
    account_number: z
        .string()
        .max(10)
        .min(1, 'Account number must be 10 digits'),
    account_name: z.string().min(1, 'Account name is required'),
});

export default {
    withdrawalSchema,
};
