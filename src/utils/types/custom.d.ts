import { User } from "@/resources/user/user-interface";

//adding user to the request interface
declare global {
    namespace Express {
        export interface Request {
            user?: User;
        }
    }
}
