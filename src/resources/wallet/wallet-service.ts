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

    async getSupportedBanks(): Promise<any[]> {
        const cacheKey = 'paystack_supported_banks';
        const cachedBanks = await getCachedData<any[]>(cacheKey);
        if (cachedBanks) return cachedBanks;

        const response = await axios.get('https://api.paystack.co/bank', {
            headers: { Authorization: `Bearer ${this.PAYSTACK_SECRET}` },
        });
        const banks = response.data.data;
        await cacheData(cacheKey, banks, CACHE_TTL.ONE_DAY);
        return banks;
    }

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
    async validateBankDetails(
        bank_code: string,
        account_number: string,
    ): Promise<any> {
        const banks = await this.getSupportedBanks();
        const isValidBankCode = banks.some((bank) => bank.code === bank_code);
        if (!isValidBankCode) {
            log.error('Bank code not found in supported banks:', { bank_code });
            throw new BadRequest('Invalid bank code');
        }

        try {
            const response = await axios.get(
                `https://api.paystack.co/bank/resolve?account_number=${account_number}&bank_code=${bank_code}`,
                {
                    headers: {
                        Authorization: `Bearer ${this.PAYSTACK_SECRET}`,
                    },
                },
            );

            log.info('Account resolved successfully:', response.data.data);
            return response.data.data;
        } catch (error) {
            log.error(
                'Account resolution failed:',
                error.response?.data || error.message,
            );

            if (error.response && [400, 422].includes(error.response.status)) {
                throw new BadRequest(
                    'Could not verify account details. Please ensure your bank information is correct.',
                );
            }
            throw error;
        }
    }

    async processWithdrawal(params: WithdrawalRequest): Promise<any> {
        const {
            userId,
            userType,
            amount,
            bank_code,
            account_number,
            account_name,
        } = params;

        const wallet = await this.walletModel.findOne({ userId, userType });
        if (!wallet) throw new ResourceNotFound('Wallet not found');

        const pendingWithdrawals = wallet.transactions
            .filter((t) => t.type === 'debit' && t.status === 'pending')
            .reduce((sum, t) => sum + t.amount, 0);

        if (wallet.balance - pendingWithdrawals < amount) {
            log.error('Insufficient balance:', {
                balance: wallet.balance,
                pendingWithdrawals,
                requestedAmount: amount,
            });
            throw new BadRequest(
                'Insufficient available balance due to pending withdrawals',
            );
        }

        let accountDetails;
        try {
            accountDetails = await this.validateBankDetails(
                bank_code,
                account_number,
            );

            log.info('Account validated successfully:', {
                providedName: account_name,
                resolvedName: accountDetails.account_name,
            });
        } catch (error) {
            if (error instanceof BadRequest) throw error;
            throw new ServerError(
                'An error occurred while validating bank details',
            );
        }

        // Create transfer recipient  account name returned by Paystack's validation to create recipient
        const resolvedAccountName = accountDetails.account_name || account_name;
        let recipient_code;
        try {
            const recipientResponse = await axios.post(
                this.PAYSTACK_RECIPIENT_URL,
                {
                    type: 'nuban',
                    name: resolvedAccountName,
                    account_number: account_number,
                    bank_code: bank_code,
                    currency: 'NGN',
                },
                {
                    headers: {
                        Authorization: `Bearer ${this.PAYSTACK_SECRET}`,
                        'Content-Type': 'application/json',
                    },
                },
            );
            recipient_code = recipientResponse.data.data.recipient_code;

            log.info('Recipient created successfully:', {
                recipient_code,
                account: account_number,
            });
        } catch (error) {
            log.error('Paystack recipient creation error:', {
                status: error.response?.status,
                data: error.response?.data,
                request: {
                    bank_code,
                    account_number,
                    name: resolvedAccountName,
                },
            });
            throw new BadRequest(
                error.response?.data?.message ||
                    'Failed to create transfer recipient. Please try again later.',
            );
        }

        const reference = await generateReference();

        let transferResponse;
        try {
            transferResponse = await axios.post(
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

            log.info('Transfer initiated successfully:', {
                reference,
                status: transferResponse.data.data.status,
            });
        } catch (error) {
            log.error('Paystack transfer initiation error:', {
                status: error.response?.status,
                message: error.response?.data?.message,
                data: error.response?.data,
                error: error.message,
            });
            throw new ServerError(
                error.response?.data?.message ||
                    'Failed to initiate transfer. Please try again later.',
            );
        }

        // Record the transaction in the wallet
        const session = await mongoose.startSession();

        try {
            await session.withTransaction(async () => {
                // Re-fetch wallet to ensure we have the latest state
                const freshWallet = await this.walletModel
                    .findOne({ userId, userType })
                    .session(session);

                if (!freshWallet)
                    throw new ResourceNotFound('Wallet not found');

                // Double-check balance again within transaction
                const pendingWithdrawals = freshWallet.transactions
                    .filter((t) => t.type === 'debit' && t.status === 'pending')
                    .reduce((sum, t) => sum + t.amount, 0);

                if (freshWallet.balance - pendingWithdrawals < amount) {
                    throw new BadRequest(
                        'Insufficient available balance due to pending withdrawals',
                    );
                }

                // Add transaction record
                freshWallet.transactions.push({
                    amount,
                    type: 'debit',
                    description: `Withdrawal to bank account: ${account_number}`,
                    reference,
                    status: 'pending', // Will be updated by webhook
                    createdAt: new Date(),
                });

                await freshWallet.save({ session });
                log.info('Transaction recorded in wallet:', {
                    reference,
                    userId,
                    userType,
                });
            });

            return {
                success: true,
                message: 'Withdrawal initiated successfully',
                data: {
                    reference,
                    status: transferResponse.data.data.status,
                },
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
            log.error('Invalid webhook signature', { event, signature });
            return false;
        }

        const reference = data.reference;
        log.info('Processing webhook event:', { event, reference });
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
                    log.info('Transfer succeeded, updated wallet:', {
                        reference,
                        newBalance: wallet.balance,
                    });
                } else if (event === 'transfer.failed') {
                    transaction.status = 'failed';
                    log.info('Transfer failed, updated transaction status:', {
                        reference,
                    });
                } else {
                    log.warn('Unhandled webhook event:', { event });
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
