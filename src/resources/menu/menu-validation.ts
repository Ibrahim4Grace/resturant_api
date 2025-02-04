import { z } from 'zod';

const addMenuItemSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    description: z.string().max(100),
    price: z.string().min(0, 'Price must be a positive number'),
    quantity: z.string().min(0, 'Quantity must be a positive number'),
    category: z.string().optional(),
    image: z
        .object({
            imageId: z.string().optional(),
            imageUrl: z.string().optional(),
        })
        .optional(),
});

export default { addMenuItemSchema };
