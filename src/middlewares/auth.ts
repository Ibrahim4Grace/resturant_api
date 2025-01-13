import { NextFunction, Request, Response } from "express";
import Admin from "@/resources/admin/admin-model";
import User from "@/resources/user/user-model";
import Rider from "@/resources/rider/rider-model";
import Restaurant from "@/resources/restaurant/restaurant-model";
import { TokenService } from "@/utils/index";
import { log } from "@/utils/index";
import { ServerError, Unauthorized } from "./error";
import { UserRole } from "@/types/index";
import { AuthJwtPayload, AllowedRoles, ValidUser } from "@/types/index";

export const extractToken = (req: Request): string | null => {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
        return null;
    }
    return authHeader.split(" ")[1];
};

export const validateUser = async (userId: string): Promise<ValidUser> => {
    let user: ValidUser | null = null;

    // Check each model and map to ValidUser interface
    const mapToValidUser = (doc: any): ValidUser => ({
        id: doc._id.toString(),
        email: doc.email,
        roles: doc.roles,
        name: doc.name,
    });

    // Check each user type
    user = await User.findById(userId);
    if (user) return mapToValidUser(user);

    user = await Admin.findById(userId);
    if (user) return mapToValidUser(user);

    user = await Rider.findById(userId);
    if (user) return mapToValidUser(user);

    user = await Restaurant.findById(userId);
    if (user) return mapToValidUser(user);

    throw new Unauthorized("User not found");
};

export const isRoleAuthorized = (
    userRoles: UserRole[],
    allowedRoles: AllowedRoles,
): boolean => {
    if (allowedRoles === "any") return true;
    return userRoles.some((role) => allowedRoles.includes(role));
};

export const authMiddleware = (allowedRoles: AllowedRoles = "any") => {
    return async (req: Request, res: Response, next: NextFunction) => {
        try {
            const token = extractToken(req);
            if (!token) {
                throw new Unauthorized("No token provided");
            }

            const decoded = await TokenService.verifyAuthToken(token);
            const user = await validateUser(decoded.userId);

            if (
                allowedRoles !== "any" &&
                !isRoleAuthorized(user.roles, allowedRoles)
            ) {
                throw new Unauthorized("Insufficient permissions");
            }

            // Set user in request using AuthUser interface
            req.user = {
                id: user.id,
                email: user.email,
                roles: user.roles,
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
