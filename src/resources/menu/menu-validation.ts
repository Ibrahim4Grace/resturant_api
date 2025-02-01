import { z } from 'zod';

const addMenuItemSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    description: z.string().optional(),
    price: z.string().min(0, 'Price must be a positive number'),
    category: z.string().optional(),
    image: z
        .object({
            imageId: z.string().optional(),
            imageUrl: z.string().optional(),
        })
        .optional(),
});

const updateMenuItemSchema = z.object({
    name: z.string().min(1, 'Name is required').optional(),
    description: z.string().optional(),
    price: z.string().min(0, 'Price must be a positive number').optional(),
    category: z.string().optional(),
    image: z
        .object({
            imageId: z.string().optional(),
            imageUrl: z.string().optional(),
        })
        .optional(),
});

export default { addMenuItemSchema, updateMenuItemSchema };
