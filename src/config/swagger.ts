import swaggerJsdoc from 'swagger-jsdoc';
import { version } from '../../package.json';
import {
    allRiderDocs,
    allAdminDocs,
    allUserDocs,
    allRestaurantDocs,
    allOrderDocs,
    allMenuDocs,
    allpaymentDocs,
} from '../docs/index';

const swaggerOptions: swaggerJsdoc.Options = {
    definition: {
        openapi: '3.1.0',
        info: {
            title: 'Korex-restaurant Express API with Swagger',
            version: version,
            description:
                'OpenAPI documentation for the Korex-restaurant project',
        },
        servers: [
            {
                url: `http://localhost:${process.env.PORT}/`,
                description: 'Local server',
            },
            {
                url: 'https://chefkayrestaurant.onrender.com/',
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
            ...allAdminDocs.paths,
            ...allUserDocs.paths,
            ...allRestaurantDocs.paths,
            ...allRiderDocs.paths,
            ...allOrderDocs.paths,
            ...allMenuDocs.paths,
            ...allpaymentDocs.paths,
        },
    },
    apis: ['./src/resources/**/*.ts'],
};

export const specs = swaggerJsdoc(swaggerOptions);
