"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.upload = exports.multerConfig = void 0;
const multer_1 = __importDefault(require("multer"));
const index_1 = require("@/middlewares/index");
exports.multerConfig = {
    storage: multer_1.default.memoryStorage(),
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit
    },
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        }
        else {
            cb(new index_1.BadRequest('Only image files are allowed'));
        }
    },
};
exports.upload = (0, multer_1.default)(exports.multerConfig);
//# sourceMappingURL=multer.js.map