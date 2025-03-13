import express, { Application } from 'express';
import compression from 'compression';
import cors from 'cors';
import helmet from 'helmet';
import swaggerUi from 'swagger-ui-express';
import morgan from 'morgan';
import { EmailQueueService, OrderQueueService } from '../src/queue';
import { log } from '../src/utils';
import { keepAlive, setupRiderPaymentCron } from '../src/jobs';
import { Controller } from '../src/types';
import { errorHandler, routeNotFound } from '../src/middlewares';
import { EmailListener, FirebaseListener } from '../src/events';
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
        this.initializeEventListeners();
        this.initializeMiddlewares();
        this.initializeControllers(controllers);
        this.initializeRabbitMQ();
        this.initializeDefaultRoute();
        this.initializeErrorHandling();
        this.setupGracefulShutdown();
        this.initializeKeepAlive();
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
            // await OrderQueueService.initializeOrderQueue();
            // await OrderQueueService.startOrderWorker();
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

    private async initializeEventListeners(): Promise<void> {
        try {
            await EmailListener.listen();
            // await FirebaseListener.listen();
            log.info('Event listeners initialized successfully');
        } catch (error) {
            log.error('Failed to initialize event listeners:', error);
        }
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
            }
        };

        ['SIGINT', 'SIGTERM'].forEach((signal) =>
            process.on(signal, () => shutdown(signal)),
        );
    }

    private initializeKeepAlive(): void {
        log.info('Initializing server cron job...');
        keepAlive(config.PROD_URL);
        setupRiderPaymentCron();
    }

    public listen(): void {
        this.express.listen(this.port, () => {
            log.info(`App listening on the port ${this.port}`);
        });
    }
}

export default App;
