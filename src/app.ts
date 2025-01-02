import express, { Application } from "express";
import mongoose from "mongoose";
import compression from "compression";
import cors from "cors";
import morgan from "morgan";
import Controller from "@/utils/interfaces/controller.interface";
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
        this.initializeDefaultRoute();
        this.initializeErrorHandling();
    }

    private initializeMiddlewares(): void {
        this.express.use(helmet());
        this.express.use(cors());
        this.express.use(morgan("dev"));
        this.express.use(express.json());
        this.express.use(express.urlencoded({ extended: false }));
        this.express.use(compression());
    }

    private initializeControllers(controllers: Controller[]): void {
        controllers.forEach((controller: Controller) => {
            this.express.use("/api/v1", controller.router);
        });
    }

    private initializeDefaultRoute(): void {
        this.express.get("/", (req, res) => {
            res.status(200).json({
                success: true,
                message:
                    "Welcome to resturant API. Use /api/v1 for all API routes.",
            });
        });
    }

    private initializeErrorHandling(): void {
        this.express.use(errorHandler, routeNotFound);
    }

    private initializeDatabaseConnection(): void {
        const { MONGODB_URI } = process.env;

        if (!MONGODB_URI) {
            throw new Error("MongoDB URI is missing!");
        }

        mongoose
            .connect(MONGODB_URI)
            .then(() => console.log("Database connected successfully"))
            .catch((err) => console.error("Database connection failed:", err));
    }

    public listen(): void {
        this.express.listen(this.port, () => {
            console.log(`App listening on the port ${this.port}`);
        });
    }
}

export default App;
