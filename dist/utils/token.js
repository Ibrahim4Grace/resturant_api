"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TokenService = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const index_1 = require("@/middlewares/index");
const index_2 = require("@/config/index");
class TokenService {
    // Authentication token methods
    static createAuthToken(payload) {
        if (!index_2.config.JWT_AUTH_SECRET) {
            throw new Error('JWT_AUTH_SECRET is not defined');
        }
        return jsonwebtoken_1.default.sign(payload, index_2.config.JWT_AUTH_SECRET, {
            expiresIn: index_2.config.JWT_AUTH_EXPIRY || '1d',
        });
    }
    static verifyAuthToken(token) {
        return new Promise((resolve, reject) => {
            if (!index_2.config.JWT_AUTH_SECRET) {
                return reject(new Error('JWT_AUTH_SECRET is not defined'));
            }
            jsonwebtoken_1.default.verify(token, index_2.config.JWT_AUTH_SECRET, (err, decoded) => {
                if (err || !decoded) {
                    return reject(new index_1.Unauthorized('Invalid authentication token'));
                }
                resolve(decoded);
            });
        });
    }
    // Email verification token methods
    static createEmailVerificationToken(payload) {
        if (!index_2.config.JWT_EMAIL_SECRET) {
            throw new Error('JWT_EMAIL_SECRET is not defined');
        }
        return jsonwebtoken_1.default.sign(payload, index_2.config.JWT_EMAIL_SECRET, {
            expiresIn: index_2.config.EMAIL_TOKEN_EXPIRY,
        });
    }
    static verifyEmailToken(token) {
        return new Promise((resolve, reject) => {
            if (!index_2.config.JWT_EMAIL_SECRET) {
                return reject(new Error('JWT_EMAIL_SECRET is not defined'));
            }
            jsonwebtoken_1.default.verify(token, index_2.config.JWT_EMAIL_SECRET, (err, decoded) => {
                if (err || !decoded) {
                    return reject(new index_1.Unauthorized('Invalid or expired verification token'));
                }
                resolve(decoded);
            });
        });
    }
}
exports.TokenService = TokenService;
//# sourceMappingURL=token.js.map