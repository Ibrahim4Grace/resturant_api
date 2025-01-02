import { cleanEnv, str, port } from "envalid";

function validateEnv(): void {
    cleanEnv(process.env, {
        NODE_ENV: str({
            choices: ["development", "production"],
        }),
        PORT: port({ default: 8000 }),
        MONGODB_URI: str(),
        JWT_SECRET: str(),
        // MONGO_USER: str(),
        // MONGO_PASSWORD: str(),
        // MONGO_PATH: str(),
        // MONGO_DB: str(),
    });
}

export default validateEnv;
