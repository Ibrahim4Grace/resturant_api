import { Request, Response, Router } from 'express';
import { Controller } from '../../types/index';
import { WalletService } from './wallet-service';
import RestaurantModel from '../restaurant/restaurant-model';
import RiderModel from '../rider/rider-model';
import validate from './wallet-validation';
import {
    validateData,
    asyncHandler,
    ResourceNotFound,
    sendJsonResponse,
    authAndAuthorize,
} from '../../middlewares';

export default class WalletController implements Controller {
    public path = '/wallet';
    public router = Router();
    private walletService: WalletService;

    constructor() {
        this.initializeRoutes();
        this.walletService = new WalletService();
    }

    private initializeRoutes(): void {
        this.router.get(
            `${this.path}/restaurant/balance`,
            ...authAndAuthorize(RestaurantModel, ['restaurant_owner']),
            this.getRestaurantWalletBalance,
        );

        this.router.get(
            `${this.path}/restaurant/transactions`,
            ...authAndAuthorize(RestaurantModel, ['restaurant_owner']),
            this.getRestaurantTransactions,
        );

        this.router.post(
            `${this.path}/restaurant/withdraw`,
            ...authAndAuthorize(RestaurantModel, ['restaurant_owner']),
            validateData(validate.withdrawalSchema),
            this.restaurantWithdrawal,
        );
        this.router.get(
            `${this.path}/rider/balance`,
            ...authAndAuthorize(RiderModel, ['rider']),
            this.getRiderWalletBalance,
        );

        this.router.get(
            `${this.path}/rider/transactions`,
            ...authAndAuthorize(RiderModel, ['rider']),
            this.getRiderTransactions,
        );

        this.router.post(
            `${this.path}/rider/withdraw`,
            ...authAndAuthorize(RiderModel, ['rider']),
            validateData(validate.withdrawalSchema),
            this.riderWithdrawal,
        );
    }

    private getRestaurantWalletBalance = asyncHandler(
        async (req: Request, res: Response) => {
            const restaurantId = req.currentUser._id;

            if (!restaurantId) {
                throw new ResourceNotFound('Restaurant not found');
            }

            const balance = await this.walletService.getWalletBalance(
                restaurantId,
                'restaurant',
            );

            return sendJsonResponse(
                res,
                200,
                'Wallet balance retrieved successfully',
                { balance },
            );
        },
    );

    private getRestaurantTransactions = asyncHandler(
        async (req: Request, res: Response) => {
            const restaurantId = req.currentUser._id;

            if (!restaurantId) {
                throw new ResourceNotFound('Restaurant not found');
            }

            const transactions = await this.walletService.getWalletTransactions(
                restaurantId,
                'restaurant',
            );

            return sendJsonResponse(
                res,
                200,
                'Wallet transactions retrieved successfully',
                { transactions },
            );
        },
    );

    private restaurantWithdrawal = asyncHandler(
        async (req: Request, res: Response) => {
            const restaurantId = req.currentUser._id;

            if (!restaurantId) {
                throw new ResourceNotFound('Restaurant not found');
            }

            const { amount, bankCode, accountNumber, accountName } = req.body;

            const result = await this.walletService.processWithdrawal({
                userId: restaurantId,
                userType: 'restaurant',
                amount,
                bankCode,
                accountNumber,
                accountName,
            });

            return sendJsonResponse(
                res,
                200,
                'Withdrawal initiated successfully',
                result.data,
            );
        },
    );

    private getRiderWalletBalance = asyncHandler(
        async (req: Request, res: Response) => {
            const riderId = req.currentUser._id;

            if (!riderId) {
                throw new ResourceNotFound('Rider not found');
            }

            const balance = await this.walletService.getWalletBalance(
                riderId,
                'rider',
            );

            return sendJsonResponse(
                res,
                200,
                'Wallet balance retrieved successfully',
                { balance },
            );
        },
    );

    private getRiderTransactions = asyncHandler(
        async (req: Request, res: Response) => {
            const riderId = req.currentUser._id;

            if (!riderId) {
                throw new ResourceNotFound('Rider not found');
            }

            const transactions = await this.walletService.getWalletTransactions(
                riderId,
                'rider',
            );

            return sendJsonResponse(
                res,
                200,
                'Wallet transactions retrieved successfully',
                { transactions },
            );
        },
    );

    private riderWithdrawal = asyncHandler(
        async (req: Request, res: Response) => {
            const riderId = req.currentUser._id;

            if (!riderId) {
                throw new ResourceNotFound('Rider not found');
            }

            const { amount, bankCode, accountNumber, accountName } = req.body;

            const result = await this.walletService.processWithdrawal({
                userId: riderId,
                userType: 'rider',
                amount,
                bankCode,
                accountNumber,
                accountName,
            });

            return sendJsonResponse(
                res,
                200,
                'Withdrawal initiated successfully',
                result.data,
            );
        },
    );
}
