import { IUser, IAddress } from '../resources/user/user-interface';
import { IRestaurant } from '../resources/restaurant/restaurant-interface';
import { IRider } from '../resources/rider/rider-interface';
import { IAdmin } from '../resources/admin/admin-interface';
import { IOrder } from '../resources/order/order-interface';
import { IMenu } from '../resources/menu/menu-interface';
import { IReview } from '../resources/review/review-interface';
import { IWallet } from 'resources/wallet/wallet-interface';

export const UserRoles = {
    User: 'user',
    Admin: 'admin',
    RestaurantOwner: 'restaurant_owner',
    Rider: 'rider',
};

export type UserRole = (typeof UserRoles)[keyof typeof UserRoles];

export interface AuthJwtPayload {
    userId: string;
    role: UserRole;
}

export interface EmailVerificationPayload {
    userId: string;
    email: string;
}

export interface EmailTemplate {
    subject: string;
    template: string;
}

export interface EmailData {
    from: string;
    to: string;
    subject: string;
    html: string;
    text?: string;
    context?: {
        title: string;
        name: string;
        intro: string;
        description: string;
        orderDetails: {
            orderNumber: string;
            orderDate: string;
            amount: string;
        };
        ctaText: string;
        ctaUrl: string;
        footerText: string;
    };
}

export interface LoginCredentials {
    email: string;
    password: string;
    role?: UserRole;
}

export interface AuthUser {
    id: string;
    email: string;
    role: UserRole;
    name: string;
}

export interface IPaginationResponse {
    currentPage: number;
    totalPages: number;
    limit: number;
}

export interface IPaginatedEntityResponse<T> {
    results: T[];
    pagination: IPaginationResponse;
}

// Entity-specific response types
export type IAddressPaginatedResponse = IPaginatedEntityResponse<IAddress>;
export type IAdminPaginatedResponse = IPaginatedEntityResponse<IAdmin>;
export type IMenuPaginatedResponse = IPaginatedEntityResponse<IMenu>;
export type IUserPaginatedResponse = IPaginatedEntityResponse<IUser>;
export type IRiderPaginatedResponse = IPaginatedEntityResponse<IRider>;
export type IOrderPaginatedResponse = IPaginatedEntityResponse<IOrder>;
export type IReviewPaginatedResponse = IPaginatedEntityResponse<IReview>;
export type IRestaurantPaginatedResponse =
    IPaginatedEntityResponse<IRestaurant>;

declare global {
    namespace Express {
        interface Response {
            paginatedResults?: {
                results: unknown[];
                pagination: IPaginationResponse;
            };
        }

        interface Request {
            ownerId?: string;
            user?: AuthUser;
            currentUser?: IUser;
        }
    }
}

export interface ValidUser {
    id: string;
    email: string;
    role: UserRole;
    name: string;
}

export interface UploadedImage {
    imageId: string;
    imageUrl: string;
}

export interface IWebhookResponse {
    event: string;
    data: any;
    signature: string;
    rawBody: string;
}
