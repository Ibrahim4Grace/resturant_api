import { Router, Request, Response, NextFunction } from "express";
import { Forbidden } from "@/middlewares/index";

export const checkRole = () => {
    // return (req: Request, res: Response, next: NextFunction) => {
    //     const user = req.user;
    //     if (!user || !roles.includes(user.roles as UserRole)) {
    //         throw new Forbidden(
    //             "You do not have permission to access this resource.",
    //         );
    //     }
    //     next();
    // };
};
