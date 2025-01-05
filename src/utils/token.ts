import jwt from "jsonwebtoken";
import { Token, TokenPayload } from "@/utils/interfaces/token-interface";

export const createToken = (entity: TokenPayload): string => {
    if (!process.env.JWT_SECRET) {
        throw new Error("JWT_SECRET is not defined in environment variables");
    }

    return jwt.sign(
        { id: entity._id, role: entity.role },
        process.env.JWT_SECRET as jwt.Secret,
        {
            expiresIn: "1d",
        },
    );
};

export const verifyToken = async (token: string): Promise<Token> => {
    if (!process.env.JWT_SECRET) {
        throw new Error("JWT_SECRET is not defined in environment variables");
    }

    return new Promise((resolve, reject) => {
        jwt.verify(
            token,
            process.env.JWT_SECRET as jwt.Secret,
            (err, payload) => {
                if (err) return reject(err);
                if (!payload) return reject(new Error("Empty payload"));
                resolve(payload as Token);
            },
        );
    });
};
