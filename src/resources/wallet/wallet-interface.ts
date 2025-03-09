import { Types, Document } from 'mongoose';

export interface IWallet extends Document {
    userId: Types.ObjectId;
    userType: 'restaurant' | 'rider';
    balance: number;
    transactions: {
        amount: number;
        type: 'credit' | 'debit';
        description: string;
        reference: string;
        status: 'pending' | 'completed' | 'failed';
        createdAt: Date;
    }[];
    createdAt: Date;
    updatedAt: Date;
}

export interface WalletTransaction {
    userId: string;
    userType: 'restaurant' | 'rider';
    amount: number;
    type: 'credit' | 'debit';
    description: string;
    reference?: string;
}

export interface WithdrawalRequest {
    userId: string;
    userType: 'restaurant' | 'rider';
    amount: number;
    bankCode: string;
    accountNumber: string;
    accountName: string;
}

export interface ITransaction {
    amount: number;
    type: 'credit' | 'debit';
    description: string;
    reference: string;
    status: 'pending' | 'completed' | 'failed';
    createdAt: Date;
    _id?: string;
}

export interface IWalletPaginatedResponse {
    results: ITransaction[];
    pagination: {
        currentPage: number;
        totalPages: number;
        limit: number;
    };
}
