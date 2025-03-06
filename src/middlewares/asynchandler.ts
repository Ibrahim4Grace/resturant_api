import { NextFunction, Request, Response } from 'express';

/**
 * Async handler to wrap the API routes, this allows for async error handling.
 * @param fn Function to call for the API endpoint
 * @returns Promise with a catch statement
 */

export const asyncHandler =
    (fn: Function) => (req: Request, res: Response, next: NextFunction) => {
        Promise.resolve(fn(req, res, next)).catch((error) => {
            console.error('Async handler error:', error);
            res.status(500).json({
                success: false,
                status_code: 500,
                message: error.message || 'Internal Server Error',
            });
        });
    };
