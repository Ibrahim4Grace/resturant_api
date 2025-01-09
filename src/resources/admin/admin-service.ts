import AdminModel from "@/resources/admin/admin-model";
import { createToken, addEmailToQueue } from "@/utils/index";
import { IAdmin } from "@/resources/admin/admin-interface";
import { UserRole } from "@/enums/userRoles";
import {
    sendOTPByEmail,
    welcomeEmail,
    PasswordResetEmail,
} from "@/resources/user/user-email-template";
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

    public async register(adminData: {
        name: string;
        email: string;
        password: string;
        role?: UserRole;
    }): Promise<{ admin: Partial<IAdmin>; verificationToken: string }> {
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
        const otp = await admin.generateOTP();
        await admin.save();

        const emailOptions = sendOTPByEmail(admin as IAdmin, otp);
        await addEmailToQueue(emailOptions);

        const sanitizedUser: Partial<IAdmin> = {
            _id: admin._id,
            name: admin.name,
            email: admin.email,
            role: admin.role,
            isEmailVerified: admin.isEmailVerified,
            createdAt: admin.createdAt,
            updatedAt: admin.updatedAt,
        };

        return {
            admin: sanitizedUser,
            verificationToken: admin.otpData?.verificationToken || "",
        };
    }
    public async login(credentials: {
        email: string;
        password: string;
    }): Promise<{ admin: IAdmin; token: string }> {
        const admin = await this.admin.findOne({ email: credentials.email });
        if (!admin) {
            throw new ResourceNotFound("Invalid email or password");
        }

        const isValid = await admin.comparePassword(credentials.password);
        if (!isValid) {
            throw new Error("Invalid email or password");
        }

        const token = createToken({
            userId: admin._id.toString(),
            role: admin.role as UserRole,
        });

        return { admin, token };
    }

    /**
     * Get all admin
     */
    public async getAdmins(): Promise<IAdmin[]> {
        const admins = await this.admin
            .find({ deleted: false })
            .select("-password") // Exclude password from results
            .sort({ createdAt: -1 });
        return admins;
    }

    /**
     * Get admin by id
     */
    public async getAdminById(id: string): Promise<IAdmin | null> {
        const admin = await this.admin
            .findOne({ _id: id, deleted: false })
            .select("-password");
        return admin;
    }

    /**
     * Submit data for an admin
     */
    public async updateAdminById(
        id: string,
        data: Partial<IAdmin>,
    ): Promise<IAdmin | null> {
        const admin = await this.admin.findOneAndUpdate(
            { _id: id, deleted: false }, // Match admin by ID and not deleted
            { $set: data }, // Update with new data
            { new: true }, // Return the updated document
        );

        return admin;
    }
}
