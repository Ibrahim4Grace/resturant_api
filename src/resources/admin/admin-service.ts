import AdminModel from "@/resources/admin/admin-model";
import token from "@/utils/token";
import Admin from "@/resources/admin/admin-interface";
import {
    asyncHandler,
    Conflict,
    ResourceNotFound,
    BadRequest,
    Forbidden,
    Unauthorized,
} from "@/middlewares/index";

export class AdminService {
    private admin = AdminModel;

    /**
     * Register a new user
     */
    public async register(adminData: {
        name: string;
        email: string;
        password: string;
        role?: string;
    }): Promise<{ admin: Admin; token: string }> {
        const existingAdmin = await this.admin.findOne({
            email: adminData.email,
        });
        if (existingAdmin) {
            throw new Conflict("Email already registered!");
        }

        const admin = await this.admin.create({
            ...adminData,
            role: adminData.role || "admin",
        });

        const accessToken = token.createToken(admin);
        return { admin, token: accessToken };
    }

    /**
     * Attempt to login
     */
    public async login(credentials: {
        email: string;
        password: string;
    }): Promise<{ admin: Admin; token: string }> {
        const admin = await this.admin.findOne({ email: credentials.email });
        if (!admin) {
            throw new ResourceNotFound("Invalid email or password");
        }

        const isValid = await admin.comparePassword(credentials.password);
        if (!isValid) {
            throw new Error("Invalid email or password");
        }

        const accessToken = token.createToken(admin);
        return { admin, token: accessToken };
    }

    /**
     * Get all users
     */
    public async getAdmins(): Promise<Admin[]> {
        const admins = await this.admin
            .find({ deleted: false })
            .select("-password") // Exclude password from results
            .sort({ createdAt: -1 });
        return admins;
    }
}
