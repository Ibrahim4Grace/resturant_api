import swaggerJsdoc from "swagger-jsdoc";
import { version } from "../../package.json";

const swaggerOptions: swaggerJsdoc.Options = {
    definition: {
        openapi: "3.1.0",
        info: {
            title: "Korex-restaurant Express API with Swagger",
            version: version,
            description:
                "OpenAPI documentation for the Korex-restaurant project",
        },
        servers: [
            {
                url: `http://localhost:${process.env.PORT || 3000}/`,
                description: "Local server",
            },
            {
                url: "https://korex-restaurant.vercel.app/",
                description: "Live server",
            },
        ],
        tags: [
            {
                name: "default",
                description: "A list of all default routes",
            },
            {
                name: "Authentication",
                description: "A list of routes for Authentication",
            },
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: "http",
                    scheme: "bearer",
                    bearerFormat: "JWT",
                },
            },
        },
        security: [
            {
                bearerAuth: [],
            },
        ],
    },
    apis: [
        "./src/resources/user*.ts",
        "./src/resources/admin*.ts",
        "./src/resources/rider*.ts",
        "./src/resources/menuItem*.ts",
        "./src/resources/order*.ts",
        "./src/docs/*.ts",
    ],
};

// Generate API Specification
export const specs = swaggerJsdoc(swaggerOptions);
