const whitelist: string[] = (process.env.CORS_WHITELIST || "").split(",");

export const corsOptions = {
    origin: (
        origin: string | undefined,
        callback: (err: Error | null, allowed?: boolean) => void,
    ): void => {
        if (whitelist.includes(origin || "") || !origin) {
            callback(null, true);
        } else {
            callback(new Error("Not allowed by CORS"));
        }
    },
    credentials: true, // Allow credentials (cookies, authorization headers, etc.)
    optionsSuccessStatus: 201, // Some legacy browsers choke on 204
};
