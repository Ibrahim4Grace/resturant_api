"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authorization = exports.authMiddleware = exports.validateUser = exports.extractToken = void 0;
const admin_model_1 = __importDefault(require("@/resources/admin/admin-model"));
const user_model_1 = __importDefault(require("@/resources/user/user-model"));
const rider_model_1 = __importDefault(require("@/resources/rider/rider-model"));
const model_1 = __importDefault(require("@/resources/restaurant/model"));
const index_1 = require("@/utils/index");
const index_2 = require("@/middlewares/index");
const extractToken = (req) => {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
        return null;
    }
    return authHeader.split(' ')[1];
};
exports.extractToken = extractToken;
const validateUser = async (userId) => {
    let user = null;
    // Check each model and map to ValidUser interface
    const mapToValidUser = (doc) => ({
        id: doc._id.toString(),
        email: doc.email,
        role: doc.role,
        name: doc.name,
    });
    // Check each user type
    user = await user_model_1.default.findById(userId);
    if (user)
        return mapToValidUser(user);
    user = await admin_model_1.default.findById(userId);
    if (user)
        return mapToValidUser(user);
    user = await rider_model_1.default.findById(userId);
    if (user)
        return mapToValidUser(user);
    user = await model_1.default.findById(userId);
    if (user)
        return mapToValidUser(user);
    throw new index_2.Unauthorized('User not found');
};
exports.validateUser = validateUser;
const authMiddleware = () => {
    return (0, index_2.asyncHandler)(async (req, res, next) => {
        try {
            const token = (0, exports.extractToken)(req);
            if (!token) {
                throw new index_2.Unauthorized('No token provided');
            }
            const payload = await index_1.TokenService.verifyAuthToken(token);
            console.log('Full Payload:', payload);
            const user = await (0, exports.validateUser)(payload.userId);
            console.log('Validated user:', user);
            req.user = {
                id: user.id,
                email: user.email,
                role: user.role,
                name: user.name,
            };
            console.log('Set req.user to:', req.user);
            next();
        }
        catch (error) {
            index_1.log.error('Authentication errors:', error);
            if (error instanceof index_2.Unauthorized) {
                return res.status(401).json({
                    status_code: '401',
                    success: false,
                    message: error.message,
                });
            }
            throw new index_2.ServerError('INTERNAL_SERVER_ERROR');
        }
    });
};
exports.authMiddleware = authMiddleware;
const authorization = (model, roles) => (0, index_2.asyncHandler)(async (req, res, next) => {
    const userId = req.user?.id;
    if (!userId) {
        throw new index_2.Unauthorized('User not authenticated');
    }
    const currentUser = await model.findById(userId);
    console.log('Found current user:', currentUser);
    if (!currentUser) {
        throw new index_2.ResourceNotFound('User not found');
    }
    req.currentUser = currentUser;
    // Conditionally set ownerId if the property exists
    if (currentUser.ownerId) {
        req.ownerId = currentUser.ownerId;
    }
    if (!roles.includes(currentUser.role)) {
        throw new index_2.Forbidden(`Access denied ${currentUser.role} isn't allowed`);
    }
    next();
});
exports.authorization = authorization;
//# sourceMappingURL=auth.js.map