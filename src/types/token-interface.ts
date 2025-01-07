export interface Token extends Object {
    id: number;
    iat: number;
    expiresIn: number;
}

export interface TokenPayload {
    _id: string;
    role?: string;
}
