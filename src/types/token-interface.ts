export interface Token extends Object {
    id: number;
    iat: number;
    expiresIn: number;
}

export interface TokenPayload {
    id: string;
    role?: string;
}
