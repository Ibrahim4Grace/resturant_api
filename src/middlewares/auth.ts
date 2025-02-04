import { NextFunction, Request, Response } from 'express';
import Admin from '@/resources/admin/admin-model';
import User from '@/resources/user/user-model';
import Rider from '@/resources/rider/rider-model';
import Restaurant from '@/resources/restaurant/model';
import { TokenService, log } from '@/utils/index';
import { ValidUser } from '@/types/index';
import {
    asyncHandler,
    ResourceNotFound,
    ServerError,
    Unauthorized,
} from '@/middlewares/index';

export const extractToken = (req: Request): string | null => {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
        return null;
    }
    return authHeader.split(' ')[1];
};

export const validateUser = async (userId: string): Promise<ValidUser> => {
    let user: ValidUser | null = null;

    // Check each model and map to ValidUser interface
    const mapToValidUser = (doc: any): ValidUser => ({
        id: doc._id.toString(),
        email: doc.email,
        role: doc.role,
        name: doc.name,
    });

    // Check each user type
    user = await User.findById(userId);
    if (user) return mapToValidUser(user);

    user = await Admin.findById(userId);
    if (user) return mapToValidUser(user);

    user = await Rider.findById(userId);
    if (user) return mapToValidUser(user);

    user = await Restaurant.findById(userId);
    if (user) return mapToValidUser(user);

    throw new Unauthorized('User not found');
};

export const authMiddleware = () => {
    return asyncHandler(
        async (req: Request, res: Response, next: NextFunction) => {
            try {
                const token = extractToken(req);
                if (!token) {
                    throw new Unauthorized('No token provided');
                }

                const payload = await TokenService.verifyAuthToken(token);
                console.log('decoded.userId:', payload.userId);

                const user = await validateUser(payload.userId);
                console.log('Validated user:', user);

                req.user = {
                    id: user.id,
                    email: user.email,
                    role: user.role,
                    name: user.name,
                };
                console.log('Set req.user to:', req.user);

                next();
            } catch (error) {
                log.error('Authentication errors:', error);
                if (error instanceof Unauthorized) {
                    return res.status(401).json({
                        status_code: '401',
                        success: false,
                        message: error.message,
                    });
                }
                throw new ServerError('INTERNAL_SERVER_ERROR');
            }
        },
    );
};

export const getCurrentUser = (model: any) =>
    asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
        const userId = req.user?.id;
        if (!userId) {
            throw new Unauthorized('User not authenticated');
        }

        const currentUser = await model.findById(userId);
        console.log('Found current user:', currentUser);
        if (!currentUser) {
            throw new ResourceNotFound('User not found');
        }

        req.currentUser = currentUser;
        // Conditionally set ownerId if the property exists
        if (currentUser.ownerId) {
            req.ownerId = currentUser.ownerId;
        }
        next();
    });
