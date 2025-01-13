import jwt from "jsonwebtoken";
import { Unauthorized } from "@/middlewares/index";
import {
    UserRole,
    AuthJwtPayload,
    EmailVerificationPayload,
} from "@/types/index";

export class TokenService {
    // Authentication token methods
    static createAuthToken(payload: {
        userId: string;
        roles: UserRole[];
    }): string {
        if (!process.env.JWT_AUTH_SECRET) {
            throw new Error("JWT_AUTH_SECRET is not defined");
        }

        return jwt.sign(payload, process.env.JWT_AUTH_SECRET, {
            expiresIn: process.env.JWT_AUTH_EXPIRY || "1d",
        });
    }

    static verifyAuthToken(token: string): Promise<AuthJwtPayload> {
        return new Promise((resolve, reject) => {
            if (!process.env.JWT_AUTH_SECRET) {
                return reject(new Error("JWT_AUTH_SECRET is not defined"));
            }

            jwt.verify(token, process.env.JWT_AUTH_SECRET, (err, decoded) => {
                if (err || !decoded) {
                    return reject(
                        new Unauthorized("Invalid authentication token"),
                    );
                }
                resolve(decoded as AuthJwtPayload);
            });
        });
    }

    // Email verification token methods
    static createEmailVerificationToken(payload: {
        userId: string;
        email: string;
    }): string {
        if (!process.env.JWT_EMAIL_SECRET) {
            throw new Error("JWT_EMAIL_SECRET is not defined");
        }

        return jwt.sign(payload, process.env.JWT_EMAIL_SECRET, {
            expiresIn: process.env.EMAIL_TOKEN_EXPIRY,
        });
    }

    static verifyEmailToken(token: string): Promise<EmailVerificationPayload> {
        return new Promise((resolve, reject) => {
            if (!process.env.JWT_EMAIL_SECRET) {
                return reject(new Error("JWT_EMAIL_SECRET is not defined"));
            }

            jwt.verify(token, process.env.JWT_EMAIL_SECRET, (err, decoded) => {
                if (err || !decoded) {
                    return reject(
                        new Unauthorized(
                            "Invalid or expired verification token",
                        ),
                    );
                }
                resolve(decoded as EmailVerificationPayload);
            });
        });
    }
}
