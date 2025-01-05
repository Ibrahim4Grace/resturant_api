import { cleanEnv, str, port } from "envalid";

function validateEnv(): void {
    cleanEnv(process.env, {
        NODE_ENV: str({
            choices: ["development", "production"],
        }),
        PORT: port({ default: 8000 }),
        MONGODB_URI: str(),
        JWT_SECRET: str(),
        JWT_EXPIRE: str(),
        OTP_EXPIRY: str(),
        PASSWORD_RESET_TOKEN_EXPIRY: str(),
        MAILER_SERVICE: str(),
        NODEMAILER_EMAIL: str(),
        NODEMAILER_PASSWORD: str(),
        CORS_WHITELIST: str(),
    });
}

export default validateEnv;
