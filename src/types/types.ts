import { IUser } from '@/resources/user/user-interface';
import { IRestaurant } from '@/resources/restaurant/interface';
import { IRider } from '@/resources/rider/rider-interface';
import { IAdmin } from '@/resources/admin/admin-interface';
import { IOrder } from '@/resources/order/order-interface';
import { IMenu } from '@/resources/menu/menu-interface';

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
export type IAdminPaginatedResponse = IPaginatedEntityResponse<IAdmin>;
export type IMenuPaginatedResponse = IPaginatedEntityResponse<IMenu>;
export type IUserPaginatedResponse = IPaginatedEntityResponse<IUser>;
export type IRiderPaginatedResponse = IPaginatedEntityResponse<IRider>;
export type IOrderPaginatedResponse = IPaginatedEntityResponse<IOrder>;
export type IRestaurantPaginatedResponse =
    IPaginatedEntityResponse<IRestaurant>;

declare global {
    namespace Express {
        interface Response {
            paginatedResults?: IPaginationResponse;
        }

        interface Request {
            ownerId?: any;
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

// export interface MulterFile {
//     fieldname: string;
//     originalname: string;
//     encoding: string;
//     mimetype: string;
//     size: number;
//     destination: string;
//     filename: string;
//     path: string;
//     buffer: Buffer;
//     // eslint-disable-next-line @typescript-eslint/no-explicit-any
//     stream: any;
// }
