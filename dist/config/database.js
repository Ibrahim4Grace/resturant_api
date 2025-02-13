"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeDatabase = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const index_1 = require("@/utils/index");
const initializeDatabase = async () => {
    const { MONGODB_URI } = process.env;
    if (!MONGODB_URI) {
        throw new Error('MongoDB URI is missing!');
    }
    try {
        await mongoose_1.default.connect(MONGODB_URI);
        index_1.log.info('Database connected successfully');
    }
    catch (err) {
        index_1.log.error('Database connection failed:', err);
        process.exit(1);
    }
};
exports.initializeDatabase = initializeDatabase;
//# sourceMappingURL=database.js.map