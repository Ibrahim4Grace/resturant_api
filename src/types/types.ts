import { IUser } from "@/resources/user/user-interface";
import { IRestaurant } from "@/resources/restaurant/restaurant-interface";
import { IRider } from "@/resources/rider/rider-interface";
import { IAdmin } from "@/resources/admin/admin-interface";

export const UserRoles = {
    User: "user",
    Admin: "admin",
    RestaurantOwner: "restaurant_owner",
    RestaurantWorkers: "restaurant_workers",
    Rider: "rider",
} as const;

export type UserRole = (typeof UserRoles)[keyof typeof UserRoles];

export interface AuthJwtPayload {
    userId: string;
    roles: UserRole[];
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

export interface LoginCredentials {
    email: string;
    password: string;
    roles?: UserRole;
}

export type AllowedRoles = UserRole[] | "any";

export interface AuthUser {
    id: string;
    email: string;
    roles: UserRole[];
    name: string;
}

declare global {
    namespace Express {
        interface Request {
            user?: AuthUser;
        }
    }
}

export interface ValidUser {
    id: string;
    email: string;
    roles: UserRole[];
    name: string;
}
