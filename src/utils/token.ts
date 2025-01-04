import jwt from "jsonwebtoken";
import { User } from "@/resources/user/user-interface";
import Token from "@/utils/interfaces/token-interface";

const createToken = (user: User): string => {
    if (!process.env.JWT_SECRET) {
        throw new Error("JWT_SECRET is not defined in environment variables");
    }

    return jwt.sign(
        { id: user._id }, // Use _id instead of id for MongoDB documents
        process.env.JWT_SECRET as jwt.Secret,
        {
            expiresIn: "1d",
        },
    );
};

const verifyToken = async (token: string): Promise<Token> => {
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

export default { createToken, verifyToken };
