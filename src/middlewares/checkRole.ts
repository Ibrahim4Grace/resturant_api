import { Router, Request, Response, NextFunction } from "express";
import { Forbidden } from "@/middlewares/index";

export const checkRole = (roles: string[]) => {
    return (req: Request, res: Response, next: NextFunction) => {
        const user = req.user; // Set by authenticated middleware

        if (!user || !roles.includes(user.role)) {
            throw new Forbidden(
                "You do not have permission to access this resource.",
            );
        }
        next();
    };
};
