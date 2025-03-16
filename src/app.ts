import express, { Application } from 'express';
import compression from 'compression';
import cors from 'cors';
import helmet from 'helmet';
import swaggerUi from 'swagger-ui-express';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { logger } from '../src/utils';
import { Controller } from '../src/types';
import { errorHandler, routeNotFound } from '../src/middlewares';
import {
    keepAlive,
    riderPaymentCron,
    EmailQueueService,
    OrderQueueConsumers,
} from '../src/jobs';
import {
    corsOptions,
    config,
    specs,
    initializeDatabase,
    closeRabbitMQ,
} from '../src/config';

class App {
    public express: Application;
    public port: number;

    constructor(controllers: Controller[], port: number) {
        this.express = express();
        this.port = port;

        this.initializeDatabase();
        this.initializeMiddlewares();
        this.initializeControllers(controllers);
        this.initializeRabbitMQ();
        this.initializeDefaultRoute();
        this.initializeErrorHandling();
        this.setupGracefulShutdown();
        this.initializeKeepAlive();
    }

    private initializeMiddlewares(): void {
        const limiter = rateLimit({
            windowMs: 60 * 1000,
            max: 100,
            message: 'Too many requests from this IP, please try again later.',
        });
        this.express.use(limiter);
        this.express.use(helmet());
        this.express.use(cors(corsOptions));
        if (config.NODE_ENV === 'development') {
            this.express.use(morgan('dev'));
        }
        this.express.use(express.json({ limit: '15mb' }));
        this.express.use(express.urlencoded({ limit: '15mb', extended: true }));
        this.express.use(compression());
        this.express.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));
    }

    private initializeControllers(controllers: Controller[]): void {
        controllers.forEach((controller: Controller) => {
            this.express.use('/api/v1', controller.router);
        });
    }

    private async initializeRabbitMQ(): Promise<void> {
        try {
            await EmailQueueService.initializeEmailQueue();
            await EmailQueueService.consumeEmails();
            await OrderQueueConsumers.initializeQueues();
            await OrderQueueConsumers.startAllConsumers();
            logger.info('RabbitMQ initialized successfully');
        } catch (error) {
            logger.error('Failed to initialize RabbitMQ:', error);
            process.exit(1);
        }
    }

    private initializeDefaultRoute(): void {
        this.express.get('/', (req, res) => {
            res.send({
                message:
                    'Welcome to resturant API. Use /api/v1 for all API routes.',
            });
        });
    }

    private initializeErrorHandling(): void {
        this.express.use(routeNotFound);
        this.express.use(errorHandler);
    }

    private async initializeDatabase(): Promise<void> {
        try {
            await initializeDatabase();
        } catch (error) {
            logger.error(
                'Failed to initialize database, shutting down:',
                error,
            );
            process.exit(1);
        }
    }

    private setupGracefulShutdown(): void {
        const shutdown = async (signal: string) => {
            logger.info(`${signal} received. Shutting down gracefully...`);
            try {
                await closeRabbitMQ();
                logger.info('RabbitMQ connection closed');
                process.exit(0);
            } catch (error) {
                logger.error('Error during shutdown:', error);
            }
        };

        ['SIGINT', 'SIGTERM'].forEach((signal) =>
            process.on(signal, () => shutdown(signal)),
        );
    }

    private initializeKeepAlive(): void {
        logger.info('Initializing server cron job...');
        keepAlive(config.PROD_URL);
        riderPaymentCron();
    }

    public listen(): void {
        this.express.listen(this.port, () => {
            logger.info(`App listening on the port ${this.port}`);
        });
    }
}

export default App;
