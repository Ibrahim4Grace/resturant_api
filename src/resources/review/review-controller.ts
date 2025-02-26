import { Router, Request, Response } from 'express';
import { Controller } from '../../types/index';
import { ReviewService } from '../review/review-service';
import UserModel from '../user/user-model';
import validate from '../review/review-validation';
import {
    sendJsonResponse,
    asyncHandler,
    authorization,
    authMiddleware,
    validateData,
    ResourceNotFound,
} from '../../middlewares/index';

export default class ReviewController implements Controller {
    public path = '/reviews';
    public router = Router();
    private reviewService = new ReviewService();

    constructor() {
        this.initializeRoutes();
    }

    private initializeRoutes(): void {
        this.router.post(
            `${this.path}`,
            authMiddleware(),
            authorization(UserModel, ['user']),
            validateData(validate.reviewSchema),
            this.createReview,
        );
        this.router.put(
            `${this.path}/:reviewId`,
            authMiddleware(),
            authorization(UserModel, ['user']),
            validateData(validate.updateReview),
            this.updateReview,
        );
        this.router.delete(
            `${this.path}/:reviewId`,
            authMiddleware(),
            authorization(UserModel, ['user']),
            this.deleteReview,
        );
        this.router.get(
            `${this.path}/target/:targetType/:targetId`,
            this.getTargetReviews,
        );

        this.router.get(`${this.path}`, this.getUserReviews);
    }

    public createReview = asyncHandler(
        async (req: Request, res: Response): Promise<void> => {
            const { targetType, targetId, rating, comment } = req.body;
            const userId = req.currentUser._id;
            if (!userId) {
                throw new ResourceNotFound('User not authenticated');
            }

            const review = await this.reviewService.createReview({
                userId,
                targetType,
                targetId,
                rating,
                comment,
            });

            sendJsonResponse(res, 201, 'Review created successfully', review);
        },
    );

    public updateReview = asyncHandler(
        async (req: Request, res: Response): Promise<void> => {
            const { reviewId } = req.params;
            const { rating, comment } = req.body;
            const userId = req.currentUser._id;
            if (!userId) {
                throw new ResourceNotFound('User not authenticated');
            }

            const review = await this.reviewService.updateReview(
                reviewId,
                userId,
                { rating, comment },
            );

            sendJsonResponse(res, 200, 'Review updated successfully', review);
        },
    );

    public deleteReview = asyncHandler(
        async (req: Request, res: Response): Promise<void> => {
            const { reviewId } = req.params;
            const userId = req.currentUser._id;
            if (!userId) {
                throw new ResourceNotFound('User not authenticated');
            }

            const result = await this.reviewService.deleteReview(
                reviewId,
                userId,
            );

            sendJsonResponse(res, 200, 'Review deleted successfully', result);
        },
    );

    public getTargetReviews = asyncHandler(
        async (req: Request, res: Response): Promise<void> => {
            const { targetType, targetId } = req.params;
            if (targetType !== 'restaurant' && targetType !== 'menu') {
                throw new Error('Invalid target type');
            }

            const reviews = await this.reviewService.getReviewsForTarget(
                targetType,
                targetId,
            );

            sendJsonResponse(
                res,
                200,
                'Reviews retrieved successfully',
                reviews,
            );
        },
    );

    public getUserReviews = asyncHandler(
        async (req: Request, res: Response): Promise<void> => {
            const reviews = await this.reviewService.getReviews(req, res);

            sendJsonResponse(
                res,
                200,
                'Reviews retrieved successfully',
                reviews,
            );
        },
    );
}
