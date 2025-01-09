import jwt from "jsonwebtoken";
import { JwtPayload } from "@/types/index";
import { UserRole } from "@/enums/userRoles";
import { Unauthorized } from "@/middlewares/index";

export const createToken = (payload: {
    userId: string;
    role: UserRole;
}): string => {
    if (!process.env.JWT_SECRET) {
        throw new Error("JWT_SECRET is not defined");
    }

    return jwt.sign(payload, process.env.JWT_SECRET!, {
        expiresIn: "1d",
    });
};

export const verifyToken = (token: string): Promise<JwtPayload> => {
    return new Promise((resolve, reject) => {
        if (!process.env.JWT_SECRET) {
            return reject(new Error("JWT_SECRET is not defined"));
        }

        jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
            if (err || !decoded) {
                return reject(new Unauthorized("Invalid token"));
            }
            resolve(decoded as JwtPayload);
        });
    });
};
