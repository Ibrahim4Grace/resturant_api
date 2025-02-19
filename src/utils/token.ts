import jwt, { SignOptions } from 'jsonwebtoken';
import { Unauthorized } from '../middlewares/index';
import { config } from '../config/index';
import {
    UserRole,
    AuthJwtPayload,
    EmailVerificationPayload,
} from '../types/index';

export class TokenService {
    // Authentication token methods
    static createAuthToken(payload: {
        userId: string;
        role: UserRole;
    }): string {
        if (!config.JWT_AUTH_SECRET) {
            throw new Error('JWT_AUTH_SECRET is not defined');
        }

        const options: SignOptions = {
            expiresIn: config.JWT_AUTH_EXPIRY || '1d',
        };

        return jwt.sign(payload, config.JWT_AUTH_SECRET, options);
    }

    static verifyAuthToken(token: string): Promise<AuthJwtPayload> {
        return new Promise((resolve, reject) => {
            if (!config.JWT_AUTH_SECRET) {
                return reject(new Error('JWT_AUTH_SECRET is not defined'));
            }

            jwt.verify(token, config.JWT_AUTH_SECRET, (err, decoded) => {
                if (err || !decoded) {
                    return reject(
                        new Unauthorized('Invalid authentication token'),
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
        if (!config.JWT_EMAIL_SECRET) {
            throw new Error('JWT_EMAIL_SECRET is not defined');
        }
        const options: SignOptions = {
            expiresIn: config.EMAIL_TOKEN_EXPIRY,
        };

        return jwt.sign(payload, config.JWT_EMAIL_SECRET, options);
    }

    static verifyEmailToken(token: string): Promise<EmailVerificationPayload> {
        return new Promise((resolve, reject) => {
            if (!config.JWT_EMAIL_SECRET) {
                return reject(new Error('JWT_EMAIL_SECRET is not defined'));
            }

            jwt.verify(token, config.JWT_EMAIL_SECRET, (err, decoded) => {
                if (err || !decoded) {
                    return reject(
                        new Unauthorized(
                            'Invalid or expired verification token',
                        ),
                    );
                }
                resolve(decoded as EmailVerificationPayload);
            });
        });
    }
}
