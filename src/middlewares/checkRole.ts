import { Request, Response, NextFunction } from 'express';
import { Forbidden } from '@/middlewares/index';

export const checkRole = (allowedRoles: string[]) => {
    return (req: Request, res: Response, next: NextFunction) => {
        const userRole = req.currentUser?.role;

        if (!allowedRoles.includes(userRole)) {
            return next(
                new Forbidden(
                    'You do not have permissions to visit this page.',
                ),
            );
        }
        next();
    };
};
