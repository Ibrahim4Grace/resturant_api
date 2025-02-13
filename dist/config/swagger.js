"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.specs = void 0;
const swagger_jsdoc_1 = __importDefault(require("swagger-jsdoc"));
const package_json_1 = require("../../package.json");
const index_1 = require("../docs/index");
const swaggerOptions = {
    definition: {
        openapi: '3.1.0',
        info: {
            title: 'Korex-restaurant Express API with Swagger',
            version: package_json_1.version,
            description: 'OpenAPI documentation for the Korex-restaurant project',
        },
        servers: [
            {
                url: `http://localhost:${process.env.PORT}/`,
                description: 'Local server',
            },
            {
                url: 'https://korex-restaurant.vercel.app/',
                description: 'Live server',
            },
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                },
            },
        },
        security: [
            {
                bearerAuth: [],
            },
        ],
        paths: {
            ...index_1.allAdminDocs.paths,
            ...index_1.allUserDocs.paths,
            ...index_1.allRestaurantDocs.paths,
            ...index_1.allRiderDocs.paths,
            ...index_1.allOrderDocs.paths,
            ...index_1.allMenuDocs.paths,
            ...index_1.allpaymentDocs.paths,
        },
    },
    apis: ['./src/resources/**/*.ts'],
};
exports.specs = (0, swagger_jsdoc_1.default)(swaggerOptions);
//# sourceMappingURL=swagger.js.map