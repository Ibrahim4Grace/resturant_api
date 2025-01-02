import { z, ZodError } from "zod";

const register = z.object({
    name: z.string().min(1).max(30),
    email: z.string().email(),
    password: z.string().min(6),
});

const login = z.object({
    email: z.string().email(),
    password: z.string().min(6),
});

const contact = z.object({
    first_name: z.string().min(6),
    last_name: z.string().min(6),
    number: z.string().min(6),
    email: z.string().email(),
    subject: z.string().min(2),
    message: z.string().max(250),
});

export default { register, login, contact };
