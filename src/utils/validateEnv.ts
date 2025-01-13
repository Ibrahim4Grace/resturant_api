import { cleanEnv, str, port, num } from "envalid";

function validateEnv(): void {
    cleanEnv(process.env, {
        NODE_ENV: str({
            choices: ["development", "production"],
        }),
        PORT: port({ default: 5000 }),
        MONGODB_URI: str(),
        JWT_AUTH_SECRET: str(),
        JWT_AUTH_EXPIRY: str(),
        JWT_EMAIL_SECRET: str(),
        EMAIL_TOKEN_EXPIRY: str(),
        OTP_EXPIRY: num(),
        MAILER_SERVICE: str(),
        NODEMAILER_EMAIL: str(),
        NODEMAILER_PASSWORD: str(),
        CORS_WHITELIST: str(),
        // REDIS_HOST: str(),
        // REDIS_PORT: num(),
    });
}

export default validateEnv;
