import express, { Application } from 'express';
import compression from 'compression';
import cors from 'cors';
import helmet from 'helmet';
import swaggerUi from 'swagger-ui-express';
import morgan from 'morgan';
import { log, EmailQueueService } from '../src/utils/index';
import { Controller } from '../src/types/index';
import { errorHandler, routeNotFound } from '../src/middlewares/index';
import {
    corsOptions,
    config,
    specs,
    initializeDatabase,
    closeRabbitMQ,
} from '../src/config/index';

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
    }

    private initializeMiddlewares(): void {
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
            log.info('RabbitMQ initialized successfully');
        } catch (error) {
            log.error('Failed to initialize RabbitMQ:', error);
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
        await initializeDatabase();
    }

    private setupGracefulShutdown(): void {
        const shutdown = async (signal: string) => {
            log.info(`${signal} received. Shutting down gracefully...`);
            try {
                await closeRabbitMQ();
                log.info('RabbitMQ connection closed');
                process.exit(0);
            } catch (error) {
                log.error('Error during shutdown:', error);
                process.exit(1);
            }
        };

        ['SIGINT', 'SIGTERM'].forEach((signal) =>
            process.on(signal, () => shutdown(signal)),
        );
    }

    public listen(): void {
        this.express.listen(this.port, () => {
            log.info(`App listening on the port ${this.port}`);
        });
    }
}

export default App;
