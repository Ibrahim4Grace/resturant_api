import { UserRole } from "@/enums/userRoles";
import { IUser } from "@/resources/user/user-interface";
import IRestaurant from "@/resources/restaurant/restaurant-interface";
import IRider from "@/resources/rider/rider-interface";
import { IAdmin } from "@/resources/admin/admin-interface";

export type ValidUser = IUser | IRestaurant | IAdmin | IRider;

// Create a type for the allowed roles
export type AllowedRoles = UserRole[] | "any";

export interface JwtPayload {
    userId: string;
    role: UserRole;
    // aud?: string;
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

export interface MulterFile {
    fieldname: string;
    originalname: string;
    encoding: string;
    mimetype: string;
    size: number;
    destination: string;
    filename: string;
    path: string;
    buffer: Buffer;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    stream: any;
}
