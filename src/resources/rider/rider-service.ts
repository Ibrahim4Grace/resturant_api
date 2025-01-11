import RiderModel from "@/resources/rider/rider-model";
import { addEmailToQueue } from "@/utils/index";
import { IRider, RegisterRiderto } from "@/resources/rider/rider-interface";
import { UserRole } from "@/enums/userRoles";
import bcrypt from "bcryptjs";
import {
    sendOTPByEmail,
    welcomeEmail,
    PasswordResetEmail,
} from "@/resources/rider/rider-email-template";
import {
    asyncHandler,
    Conflict,
    ResourceNotFound,
    BadRequest,
    Forbidden,
    Unauthorized,
    authMiddleware,
    verifyToken,
} from "@/middlewares/index";

export class RiderService {
    private rider = RiderModel;

    public async register(
        riderData: RegisterRiderto,
    ): Promise<{ rider: Partial<IRider>; verificationToken: string }> {
        const existingRider = await this.rider.findOne({
            email: riderData.email,
        });
        if (existingRider) {
            throw new Conflict("Email already registered!");
        }

        const rider = await this.rider.create({
            ...riderData,
            role: riderData.role || UserRole.RIDER,
            isEmailVerified: false,
        });

        const verificationResult = await rider.generateEmailVerificationOTP();
        const { otp, verificationToken } = verificationResult;
        await rider.save();

        const emailOptions = sendOTPByEmail(rider as IRider, otp);
        await addEmailToQueue(emailOptions);

        const sanitizedRider: Partial<IRider> = {
            _id: rider._id,
            name: rider.name,
            email: rider.email,
            role: rider.role,
            isEmailVerified: rider.isEmailVerified,
            createdAt: rider.createdAt,
            updatedAt: rider.updatedAt,
        };

        return {
            rider: sanitizedRider,
            verificationToken: verificationToken,
        };
    }

    public async verifyRegistrationOTP(
        userId: string,
        otp: string,
    ): Promise<IRider> {
        const rider = await this.rider.findOne({
            _id: userId,
            isEmailVerified: false,
            "emailVerificationOTP.expiresAt": { $gt: new Date() },
        });

        if (!rider) {
            throw new BadRequest("Invalid or expired verification session");
        }

        if (!rider?.emailVerificationOTP?.otp) {
            throw new BadRequest("No OTP found for this rider");
        }

        if (new Date() > rider.emailVerificationOTP.expiresAt) {
            throw new BadRequest("OTP has expired");
        }

        const isValid = await bcrypt.compare(
            otp,
            rider.emailVerificationOTP.otp.toString(),
        );
        if (!isValid) {
            throw new BadRequest("Invalid OTP");
        }

        rider.emailVerificationOTP = undefined;
        rider.isEmailVerified = true;
        await rider.save();

        const emailOptions = welcomeEmail(rider as IRider);
        await addEmailToQueue(emailOptions);

        return rider;
    }

    public async forgotPassword(email: string): Promise<string> {
        const rider = await this.rider.findOne({
            email: email.toLowerCase().trim(),
        });
        if (!rider) {
            throw new ResourceNotFound("Rider not found");
        }

        const verificationResult = await rider.generateEmailVerificationOTP();
        const { otp, verificationToken } = verificationResult;
        await rider.save();

        const emailOptions = sendOTPByEmail(rider as IRider, otp);
        await addEmailToQueue(emailOptions);

        return verificationToken;
    }

    public async verifyResetPasswordOTP(
        verificationToken: string,
        otp: string,
    ): Promise<IRider> {
        const rider = await this.rider.findOne({
            "emailVerificationOTP.verificationToken": verificationToken,
            "emailVerificationOTP.expiresAt": { $gt: new Date() },
        });

        if (!rider) {
            throw new BadRequest("Invalid or expired reset token");
        }

        if (!rider.emailVerificationOTP?.otp) {
            throw new BadRequest("No OTP found for this rider");
        }

        if (new Date() > rider.emailVerificationOTP.expiresAt) {
            throw new BadRequest("OTP has expired");
        }

        const isValid = await bcrypt.compare(
            otp,
            rider.emailVerificationOTP.otp.toString(),
        );
        if (!isValid) {
            throw new BadRequest("Invalid OTP");
        }

        return rider;
    }

    public async resetPassword(
        verificationToken: string,
        newPassword: string,
    ): Promise<void> {
        const rider = await this.rider.findOne({
            "emailVerificationOTP.verificationToken": verificationToken,
            "emailVerificationOTP.expiresAt": { $gt: new Date() },
        });

        if (!rider) {
            throw new BadRequest("Invalid or expired reset token");
        }

        rider.passwordHistory = rider.passwordHistory ?? [];
        rider.passwordHistory.push({
            password: rider.password,
            changedAt: new Date(),
        });

        rider.password = newPassword;
        rider.emailVerificationOTP = undefined;
        await rider.save();

        const emailOptions = PasswordResetEmail(rider as IRider);
        await addEmailToQueue(emailOptions);
    }
}
