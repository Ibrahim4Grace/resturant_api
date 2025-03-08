import axios from 'axios';
import WalletModel from './wallet-model';
import { config } from '../../config';
import { generateReference, log } from '../../utils';
import { BadRequest, ResourceNotFound, ServerError } from '../../middlewares';
import {
    IWallet,
    WalletTransaction,
    WithdrawalRequest,
} from './wallet-interface';

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
        userId: string,
        userType: 'restaurant' | 'rider',
    ): Promise<any[]> {
        const wallet = await this.walletModel.findOne({ userId, userType });
        return wallet ? wallet.transactions : [];
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

        const wallet = await this.walletModel.findOne({ userId, userType });
        if (!wallet) throw new ResourceNotFound('Wallet not found');
        if (wallet.balance < amount)
            throw new BadRequest('Insufficient wallet balance');

        try {
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

            // Initiate transfer
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

            // Add a pending withdrawal transaction
            wallet.transactions.push({
                amount,
                type: 'debit',
                description: `Withdrawal to bank account: ${accountNumber}`,
                reference,
                status: 'pending',
                createdAt: new Date(),
            });

            // Don't deduct from balance yet, we'll do that when transfer is confirmed
            await wallet.save();

            return {
                success: true,
                message: 'Withdrawal initiated successfully',
                data: {
                    reference,
                    status: transferResponse.data.data.status,
                },
            };
        } catch (error) {
            log.error('Withdrawal processing error:', error);
            throw new ServerError('Withdrawal processing failed');
        }
    }

    async handleTransferWebhook(event: string, data: any): Promise<boolean> {
        if (event === 'transfer.success') {
            const reference = data.reference;
            const wallet = await this.walletModel.findOne({
                'transactions.reference': reference,
                'transactions.type': 'debit',
                'transactions.status': 'pending',
            });

            if (wallet) {
                const transaction = wallet.transactions.find(
                    (t) => t.reference === reference,
                );
                if (transaction) {
                    transaction.status = 'completed';
                    // Now deduct from wallet balance
                    wallet.balance -= transaction.amount;

                    await wallet.save();
                    return true;
                }
            }
        } else if (event === 'transfer.failed') {
            const reference = data.reference;
            const wallet = await this.walletModel.findOne({
                'transactions.reference': reference,
                'transactions.type': 'debit',
                'transactions.status': 'pending',
            });

            if (wallet) {
                const transaction = wallet.transactions.find(
                    (t) => t.reference === reference,
                );
                if (transaction) {
                    transaction.status = 'failed';
                    await wallet.save();
                    return true;
                }
            }
        }

        return false;
    }
}
