import { Request, Response } from 'express';
import mongoose from 'mongoose';
import axios from 'axios';
import WalletModel from './wallet-model';
import { config } from '../../config';
import { IWebhookResponse } from '../../types';
import crypto from 'crypto';

import { BadRequest, ResourceNotFound, ServerError } from '../../middlewares';
import {
    IWallet,
    WalletTransaction,
    WithdrawalRequest,
    IWalletPaginatedResponse,
} from './wallet-interface';
import {
    generateReference,
    log,
    getCachedData,
    CACHE_TTL,
    cacheData,
} from '../../utils';

export class WalletService {
    private readonly PAYSTACK_SECRET = config.PAYSTACK_SECRET_KEY;
    private readonly PAYSTACK_TRANSFER_URL = `${config.PAYSTACK_URL}/transfer`;
    private readonly PAYSTACK_RECIPIENT_URL = `${config.PAYSTACK_URL}/transferrecipient`;
    private walletModel = WalletModel;

    async getOrCreateWallet(
        userId: string,
        userType: 'restaurant' | 'rider',
    ): Promise<IWallet> {
        let wallet = await this.walletModel.findOne({ userId, userType });

        if (!wallet) {
            wallet = await this.walletModel.create({
                userId,
                userType,
                balance: 0,
                transactions: [],
            });
        }

        return wallet;
    }

    async findTransactionByReference(reference: string): Promise<any | null> {
        const wallet = await this.walletModel.findOne({
            'transactions.reference': reference,
        });

        if (!wallet) return null;

        const transaction = wallet.transactions.find(
            (t) => t.reference === reference,
        );
        return transaction || null;
    }

    async addTransaction(params: WalletTransaction): Promise<IWallet> {
        const { userId, userType, amount, type, description } = params;
        const reference = params.reference || (await generateReference());

        const wallet = await this.getOrCreateWallet(userId, userType);

        if (type === 'credit') {
            wallet.balance += amount;
        } else {
            if (wallet.balance < amount) {
                throw new BadRequest('Insufficient wallet balance');
            }
            wallet.balance -= amount;
        }

        // Add transaction to history
        wallet.transactions.push({
            amount,
            type,
            description,
            reference,
            status: 'completed',
            createdAt: new Date(),
        });

        await wallet.save();
        return wallet;
    }

    async getWalletBalance(
        userId: string,
        userType: 'restaurant' | 'rider',
    ): Promise<number> {
        const wallet = await this.walletModel.findOne({ userId, userType });
        return wallet ? wallet.balance : 0;
    }

    async getWalletTransactions(
        req: Request,
        res: Response,
        userId: string,
        userType: 'restaurant' | 'rider',
    ): Promise<IWalletPaginatedResponse> {
        const page = parseInt(req.query.page as string, 10) || 1;
        const limit = parseInt(req.query.limit as string, 10) || 6;
        const cacheKey = `wallet_transactions_${userId}_${userType}_page_${page}_limit_${limit}`;

        const cachedResults =
            await getCachedData<IWalletPaginatedResponse>(cacheKey);
        if (cachedResults) {
            return cachedResults;
        }

        // Fetch the wallet
        const wallet = await this.walletModel
            .findOne({ userId, userType })
            .lean();
        if (
            !wallet ||
            !wallet.transactions ||
            wallet.transactions.length === 0
        ) {
            const emptyResponse: IWalletPaginatedResponse = {
                results: [],
                pagination: {
                    currentPage: page,
                    totalPages: 0,
                    limit,
                },
            };
            await cacheData(cacheKey, emptyResponse, CACHE_TTL.FIVE_MINUTES);
            return emptyResponse;
        }

        const sortedTransactions = wallet.transactions.sort(
            (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
        );

        // Paginate the transactions array
        const totalItems = sortedTransactions.length;
        const totalPages = Math.ceil(totalItems / limit);
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + limit;
        const paginatedTransactions = sortedTransactions.slice(
            startIndex,
            endIndex,
        );

        const response: IWalletPaginatedResponse = {
            results: paginatedTransactions,
            pagination: {
                currentPage: page,
                totalPages,
                limit,
            },
        };

        // Cache the result
        await cacheData(cacheKey, response, CACHE_TTL.FIVE_MINUTES);

        return response;
    }

    async processWithdrawal(params: WithdrawalRequest): Promise<any> {
        const {
            userId,
            userType,
            amount,
            bankCode,
            accountNumber,
            accountName,
        } = params;

        const recipientResponse = await axios.post(
            this.PAYSTACK_RECIPIENT_URL,
            {
                type: 'nuban',
                name: accountName,
                account_number: accountNumber,
                bank_code: bankCode,
                currency: 'NGN',
            },
            {
                headers: {
                    Authorization: `Bearer ${this.PAYSTACK_SECRET}`,
                    'Content-Type': 'application/json',
                },
            },
        );

        const recipient_code = recipientResponse.data.data.recipient_code;
        const reference = await generateReference();
        const transferResponse = await axios.post(
            this.PAYSTACK_TRANSFER_URL,
            {
                source: 'balance',
                reason: `Withdrawal from ${userType} wallet`,
                amount: amount * 100,
                recipient: recipient_code,
                reference,
            },
            {
                headers: {
                    Authorization: `Bearer ${this.PAYSTACK_SECRET}`,
                    'Content-Type': 'application/json',
                },
            },
        );

        const session = await mongoose.startSession();

        try {
            await session.withTransaction(async () => {
                const wallet = await this.walletModel
                    .findOne({ userId, userType })
                    .session(session);
                if (!wallet) throw new ResourceNotFound('Wallet not found');

                const pendingWithdrawals = wallet.transactions
                    .filter((t) => t.type === 'debit' && t.status === 'pending')
                    .reduce((sum, t) => sum + t.amount, 0);
                if (wallet.balance - pendingWithdrawals < amount) {
                    throw new BadRequest(
                        'Insufficient available balance due to pending withdrawals',
                    );
                }

                wallet.transactions.push({
                    amount,
                    type: 'debit',
                    description: `Withdrawal to bank account: ${accountNumber}`,
                    reference,
                    status: 'pending',
                    createdAt: new Date(),
                });

                await wallet.save({ session });
            });

            return {
                success: true,
                message: 'Withdrawal initiated successfully',
                data: { reference, status: transferResponse.data.data.status },
            };
        } catch (error) {
            await session.abortTransaction();
            log.error(
                'Withdrawal processing error:',
                error.response?.data || error.message,
            );
            throw new ServerError('Withdrawal processing failed');
        } finally {
            session.endSession();
        }
    }

    private verifyWebhookSignature(data: string, signature: string): boolean {
        const hash = crypto
            .createHmac('sha512', this.PAYSTACK_SECRET)
            .update(data)
            .digest('hex');

        return hash === signature;
    }

    async handleTransferWebhook(params: IWebhookResponse): Promise<boolean> {
        const { event, data, signature, rawBody } = params;

        const isValidSignature = this.verifyWebhookSignature(
            rawBody,
            signature,
        );
        if (!isValidSignature) {
            log.error('Invalid webhook signature');
            return false;
        }

        const reference = data.reference;
        const session = await mongoose.startSession();

        try {
            let success = false;
            await session.withTransaction(async () => {
                const wallet = await this.walletModel
                    .findOne({
                        'transactions.reference': reference,
                        'transactions.type': 'debit',
                        'transactions.status': 'pending',
                    })
                    .session(session);

                if (!wallet) return;

                const transaction = wallet.transactions.find(
                    (t) =>
                        t.reference === reference &&
                        t.type === 'debit' &&
                        t.status === 'pending',
                );
                if (!transaction) return;

                if (event === 'transfer.success') {
                    transaction.status = 'completed';
                    wallet.balance -= transaction.amount;
                } else if (event === 'transfer.failed') {
                    transaction.status = 'failed';
                } else {
                    return;
                }

                await wallet.save({ session });
                success = true;
            });

            return success;
        } catch (error) {
            log.error('Webhook handling error:', error);
            return false;
        } finally {
            session.endSession();
        }
    }
}
