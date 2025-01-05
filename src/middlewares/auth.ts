import { NextFunction, Request, Response } from "express";
import { verifyToken } from "@/utils/token";
import UserModel from "@/resources/user/user-model";
import { Token } from "@/utils/interfaces/token-interface";
import { ServerError } from "@/middlewares/index";

export const authMiddleware = async (
    req: Request,
    res: Response,
    next: NextFunction,
): Promise<void> => {
    try {
        const bearer = req.headers.authorization;

        if (!bearer || !bearer.startsWith("Bearer ")) {
            res.status(401).json({
                status_code: "401",
                success: false,
                message: "Invalid token",
            });
            return;
        }

        const accessToken = bearer.split(" ")[1];
        if (!accessToken) {
            res.status(401).json({
                status_code: "401",
                success: false,
                message: "Invalid token",
            });
            return;
        }

        const payload: Token = await verifyToken(accessToken);
        const user = await UserModel.findById(payload.id)
            .select("-password")
            .exec();

        if (!user) {
            res.status(401).json({ error: "Unauthorized" });
            return;
        }

        req.user = user;
        next();
    } catch (error) {
        console.error(error);
        throw new ServerError("INTERNAL_SERVER_ERROR");
    }
};
