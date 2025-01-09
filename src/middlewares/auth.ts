import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import Admin from "@/resources/admin/admin-model";
import User from "@/resources/user/user-model";
import Rider from "@/resources/rider/rider-model";
import Restaurant from "@/resources/restaurant/restaurant-model";
import { log } from "@/utils/index";
import { ServerError, Unauthorized } from "./error";
import { UserRole } from "@/enums/userRoles";
import { JwtPayload, AllowedRoles, ValidUser } from "@/types/index";

// Helper functions
export const extractToken = (req: Request): string | null => {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
        return null;
    }
    return authHeader.split(" ")[1];
};

export const verifyToken = (token: string): Promise<JwtPayload> => {
    return new Promise((resolve, reject) => {
        jwt.verify(token, process.env.JWT_SECRET!, (err, decoded) => {
            if (err || !decoded) {
                reject(new Unauthorized("Invalid token"));
            }
            resolve(decoded as JwtPayload);
        });
    });
};

export const validateUser = async (userId: string): Promise<ValidUser> => {
    let user: ValidUser | null = null;

    user = await User.findOne({ id: userId });
    if (user) return user;

    user = await Admin.findOne({ id: userId });
    if (user) return user;

    user = await Rider.findOne({ id: userId });
    if (user) return user;

    user = await Restaurant.findOne({ id: userId });
    if (user) return user;

    throw new Unauthorized("User not found");
};

const isRoleAuthorized = (
    userRole: UserRole,
    allowedRoles: AllowedRoles,
): boolean => {
    if (allowedRoles === "any") return true;
    return allowedRoles.includes(userRole);
};

export const authMiddleware = (allowedRoles: AllowedRoles = "any") => {
    return async (req: Request, res: Response, next: NextFunction) => {
        try {
            // Token extraction
            const token = extractToken(req);
            if (!token) {
                throw new Unauthorized("No token provided");
            }

            const decoded = await verifyToken(token);

            const user = await validateUser(decoded.userId);

            if (!isRoleAuthorized(user.role as UserRole, allowedRoles)) {
                throw new Unauthorized("Insufficient permissions");
            }

            req.user = {
                userId: user.id,
                email: user.email,
                role: user.role,
                name: user.name,
            };

            next();
        } catch (error) {
            log.error("Authentication error:", error);
            if (error instanceof Unauthorized) {
                return res.status(401).json({
                    status_code: "401",
                    success: false,
                    message: error.message,
                });
            }
            throw new ServerError("INTERNAL_SERVER_ERROR");
        }
    };
};
