"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const compression_1 = __importDefault(require("compression"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const swagger_ui_express_1 = __importDefault(require("swagger-ui-express"));
const morgan_1 = __importDefault(require("morgan"));
const index_1 = require("@/utils/index");
const index_2 = require("@/middlewares/index");
const index_3 = require("@/config/index");
class App {
    constructor(controllers, port) {
        this.express = (0, express_1.default)();
        this.port = port;
        this.initializeDatabase();
        this.initializeMiddlewares();
        this.initializeControllers(controllers);
        this.initializeRabbitMQ();
        this.initializeDefaultRoute();
        this.initializeErrorHandling();
        this.setupGracefulShutdown();
    }
    initializeMiddlewares() {
        this.express.use((0, helmet_1.default)());
        this.express.use((0, cors_1.default)(index_3.corsOptions));
        if (index_3.config.NODE_ENV === 'development') {
            this.express.use((0, morgan_1.default)('dev'));
        }
        this.express.use(express_1.default.json({ limit: '15mb' }));
        this.express.use(express_1.default.urlencoded({ limit: '15mb', extended: true }));
        this.express.use((0, compression_1.default)());
        this.express.use('/api-docs', swagger_ui_express_1.default.serve, swagger_ui_express_1.default.setup(index_3.specs));
    }
    initializeControllers(controllers) {
        controllers.forEach((controller) => {
            this.express.use('/api/v1', controller.router);
        });
    }
    async initializeRabbitMQ() {
        try {
            await index_1.EmailQueueService.initializeEmailQueue();
            await index_1.EmailQueueService.consumeEmails();
            index_1.log.info('RabbitMQ initialized successfully');
        }
        catch (error) {
            index_1.log.error('Failed to initialize RabbitMQ:', error);
            process.exit(1);
        }
    }
    initializeDefaultRoute() {
        this.express.get('/', (req, res) => {
            res.send({
                message: 'Welcome to resturant API. Use /api/v1 for all API routes.',
            });
        });
    }
    initializeErrorHandling() {
        this.express.use(index_2.routeNotFound);
        this.express.use(index_2.errorHandler);
    }
    async initializeDatabase() {
        await (0, index_3.initializeDatabase)();
    }
    setupGracefulShutdown() {
        const shutdown = async (signal) => {
            index_1.log.info(`${signal} received. Shutting down gracefully...`);
            try {
                await (0, index_3.closeRabbitMQ)();
                index_1.log.info('RabbitMQ connection closed');
                process.exit(0);
            }
            catch (error) {
                index_1.log.error('Error during shutdown:', error);
                process.exit(1);
            }
        };
        ['SIGINT', 'SIGTERM'].forEach((signal) => process.on(signal, () => shutdown(signal)));
    }
    listen() {
        this.express.listen(this.port, () => {
            index_1.log.info(`App listening on the port ${this.port}`);
        });
    }
}
exports.default = App;
//# sourceMappingURL=app.js.map