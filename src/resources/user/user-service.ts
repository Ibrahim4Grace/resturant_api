import UserModel from "@/resources/user/user-model";
import ContactUsModel from "@/resources/user/user-model";
import token from "@/utils/token";
import User from "@/resources/user/user-interface";
import { ContactFormType } from "@/utils/types/index";
import {
    asyncHandler,
    Conflict,
    ResourceNotFound,
    BadRequest,
    Forbidden,
    Unauthorized,
} from "@/middlewares/index";

export class UserService {
    private user = UserModel;
    private contactUs = ContactUsModel;

    /**
     * Contact us
     */
    public async contact(userData: ContactFormType): Promise<void> {
        const user = await this.contactUs.create({
            ...userData,
        });
    }

    /**
     * Register a new user
     */
    public async register(userData: {
        name: string;
        email: string;
        password: string;
        role?: string;
    }): Promise<{ user: User; token: string }> {
        const existingUser = await this.user.findOne({ email: userData.email });
        if (existingUser) {
            throw new Conflict("Email already registered!");
        }

        const user = await this.user.create({
            ...userData,
            role: userData.role || "user", // Default to "user" if role not provided
        });

        const accessToken = token.createToken(user);
        return { user, token: accessToken };
    }

    /**
     * Attempt to login
     */
    public async login(credentials: {
        email: string;
        password: string;
    }): Promise<{ user: User; token: string }> {
        const user = await this.user.findOne({ email: credentials.email });
        if (!user) {
            throw new ResourceNotFound("Invalid email or password");
        }

        const isValid = await user.comparePassword(credentials.password);
        if (!isValid) {
            throw new Error("Invalid email or password");
        }

        const accessToken = token.createToken(user);
        return { user, token: accessToken };
    }

    /**
     * Get all users
     */
    public async getUsers(): Promise<User[]> {
        const users = await this.user
            .find({ deleted: false })
            .select("-password") // Exclude password from results
            .sort({ createdAt: -1 });
        return users;
    }
}
