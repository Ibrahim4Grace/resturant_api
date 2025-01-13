import AdminModel from "@/resources/admin/admin-model";
import { addEmailToQueue } from "@/utils/index";
import { IAdmin, RegisterAdminto } from "@/resources/admin/admin-interface";
import { UserRoles } from "@/types/index";
import bcrypt from "bcryptjs";
import {
    sendOTPByEmail,
    welcomeEmail,
    PasswordResetEmail,
} from "@/resources/admin/admin-email-template";
import {
    asyncHandler,
    Conflict,
    ResourceNotFound,
    BadRequest,
    Forbidden,
    Unauthorized,
    authMiddleware,
} from "@/middlewares/index";

export class AdminService {
    private admin = AdminModel;

    public async register(
        adminData: RegisterAdminto,
    ): Promise<{ admin: Partial<IAdmin>; verificationToken: string }> {
        const existingAdmin = await this.admin.findOne({
            email: adminData.email,
        });
        if (existingAdmin) {
            throw new Conflict("Email already registered!");
        }

        const admin = await this.admin.create({
            ...adminData,
            isEmailVerified: false,
        });

        const verificationResult = await admin.generateEmailVerificationOTP();
        const { otp, verificationToken } = verificationResult;
        await admin.save();

        const emailOptions = sendOTPByEmail(admin as IAdmin, otp);
        await addEmailToQueue(emailOptions);

        const sanitizedAdmin: Partial<IAdmin> = {
            _id: admin._id,
            name: admin.name,
            email: admin.email,
            isEmailVerified: admin.isEmailVerified,
            createdAt: admin.createdAt,
            updatedAt: admin.updatedAt,
        };

        return {
            admin: sanitizedAdmin,
            verificationToken: verificationToken,
        };
    }

    public async verifyRegistrationOTP(
        userId: string,
        otp: string,
    ): Promise<IAdmin> {
        const admin = await this.admin.findOne({
            _id: userId,
            isEmailVerified: false,
            "emailVerificationOTP.expiresAt": { $gt: new Date() },
        });

        if (!admin) {
            throw new BadRequest("Invalid or expired verification session");
        }

        if (!admin?.emailVerificationOTP?.otp) {
            throw new BadRequest("No OTP found for this admin");
        }

        if (new Date() > admin.emailVerificationOTP.expiresAt) {
            throw new BadRequest("OTP has expired");
        }

        const isValid = await bcrypt.compare(
            otp,
            admin.emailVerificationOTP.otp.toString(),
        );
        if (!isValid) {
            throw new BadRequest("Invalid OTP");
        }

        admin.emailVerificationOTP = undefined;
        admin.isEmailVerified = true;
        await admin.save();

        const emailOptions = welcomeEmail(admin as IAdmin);
        await addEmailToQueue(emailOptions);

        return admin;
    }

    public async forgotPassword(email: string): Promise<string> {
        const admin = await this.admin.findOne({
            email: email.toLowerCase().trim(),
        });
        if (!admin) {
            throw new ResourceNotFound("Admin not found");
        }

        const verificationResult = await admin.generateEmailVerificationOTP();
        const { otp, verificationToken } = verificationResult;
        await admin.save();

        const emailOptions = sendOTPByEmail(admin as IAdmin, otp);
        await addEmailToQueue(emailOptions);

        return verificationToken;
    }

    public async verifyResetPasswordOTP(
        verificationToken: string,
        otp: string,
    ): Promise<IAdmin> {
        const admin = await this.admin.findOne({
            "emailVerificationOTP.verificationToken": verificationToken,
            "emailVerificationOTP.expiresAt": { $gt: new Date() },
        });

        if (!admin) {
            throw new BadRequest("Invalid or expired reset token");
        }

        if (!admin.emailVerificationOTP?.otp) {
            throw new BadRequest("No OTP found for this admin");
        }

        if (new Date() > admin.emailVerificationOTP.expiresAt) {
            throw new BadRequest("OTP has expired");
        }

        const isValid = await bcrypt.compare(
            otp,
            admin.emailVerificationOTP.otp.toString(),
        );
        if (!isValid) {
            throw new BadRequest("Invalid OTP");
        }

        return admin;
    }

    public async resetPassword(
        verificationToken: string,
        newPassword: string,
    ): Promise<void> {
        const admin = await this.admin.findOne({
            "emailVerificationOTP.verificationToken": verificationToken,
            "emailVerificationOTP.expiresAt": { $gt: new Date() },
        });

        if (!admin) {
            throw new BadRequest("Invalid or expired reset token");
        }

        // Add the old password to history before updating
        admin.passwordHistory = admin.passwordHistory ?? [];
        admin.passwordHistory.push({
            password: admin.password,
            changedAt: new Date(),
        });

        admin.password = newPassword;
        admin.emailVerificationOTP = undefined;
        await admin.save();

        const emailOptions = PasswordResetEmail(admin as IAdmin);
        await addEmailToQueue(emailOptions);
    }
}
