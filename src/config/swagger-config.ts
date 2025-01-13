import swaggerJsdoc from "swagger-jsdoc";
import { version } from "../../package.json";
import { allAuthDocs } from "../docs/index";

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
                url: `http://localhost:${process.env.PORT}/`,
                description: "Local server",
            },
            {
                url: "https://korex-restaurant.vercel.app/",
                description: "Live server",
            },
        ],
        tags: [
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
        paths: {
            ...allAuthDocs.paths,
        },
    },
    apis: [],
};

export const specs = swaggerJsdoc(swaggerOptions);
