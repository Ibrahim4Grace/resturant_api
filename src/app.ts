import express, { Application } from "express";
import mongoose from "mongoose";
import compression from "compression";
import cors from "cors";
import { corsOptions, specs, ServerAdapter } from "@/config/index";
import swaggerUi from "swagger-ui-express";
import morgan from "morgan";
import { log } from "@/utils/index";
import { Controller } from "@/types/index";
import { errorHandler, routeNotFound } from "@/middlewares/index";
import helmet from "helmet";

class App {
    public express: Application;
    public port: number;

    constructor(controllers: Controller[], port: number) {
        this.express = express();
        this.port = port;

        this.initializeDatabaseConnection();
        this.initializeMiddlewares();
        this.initializeControllers(controllers);
        this.initializeQueueRoutes();
        this.initializeDefaultRoute();
        this.initializeErrorHandling();
    }

    private initializeMiddlewares(): void {
        this.express.use(helmet());
        this.express.use(cors(corsOptions));
        this.express.use(morgan("dev"));
        this.express.use(express.json({ limit: "15mb" }));
        this.express.use(
            express.urlencoded({ limit: "15mb", extended: false }),
        );
        this.express.use(compression());
        this.express.use("/api-docs", swaggerUi.serve, swaggerUi.setup(specs));
    }

    private initializeControllers(controllers: Controller[]): void {
        controllers.forEach((controller: Controller) => {
            this.express.use("/api/v1", controller.router);
        });
    }

    private initializeQueueRoutes(): void {
        this.express.use("/admin/queues", ServerAdapter.getRouter());
    }

    private initializeDefaultRoute(): void {
        this.express.get("/", (req, res) => {
            res.send({
                message:
                    "Welcome to resturant API. Use /api/v1 for all API routes.",
            });
        });
    }

    private initializeErrorHandling(): void {
        this.express.use(routeNotFound);
        this.express.use(errorHandler);
    }

    private initializeDatabaseConnection(): void {
        const { MONGODB_URI } = process.env;

        if (!MONGODB_URI) {
            throw new Error("MongoDB URI is missing!");
        }

        mongoose
            .connect(MONGODB_URI)
            .then(() => log.info("Database connected successfully"))
            .catch((err) => console.error("Database connection failed:", err));
    }

    public listen(): void {
        this.express.listen(this.port, () => {
            log.info(`App listening on the port ${this.port}`);
        });
    }
}

export default App;
