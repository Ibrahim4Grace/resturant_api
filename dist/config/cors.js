"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.corsOptions = void 0;
const whitelist = (process.env.CORS_WHITELIST || '').split(',');
exports.corsOptions = {
    origin: (origin, callback) => {
        if (whitelist.includes(origin || '') || !origin) {
            callback(null, true);
        }
        else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true, // Allow credentials (cookies, authorization headers, etc.)
    optionsSuccessStatus: 201, // Some legacy browsers choke on 204
};
//# sourceMappingURL=cors.js.map