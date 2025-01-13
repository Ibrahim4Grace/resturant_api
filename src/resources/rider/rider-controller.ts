import { Router, Request, Response, NextFunction } from "express";
import { Controller } from "@/types/index";
import validate from "@/resources/rider/rider-validation";
import { RiderService } from "@/resources/rider/rider-service";
import { TokenService } from "@/utils/index";
import {
    validateData,
    sendJsonResponse,
    asyncHandler,
    Conflict,
    ResourceNotFound,
    BadRequest,
    Forbidden,
    Unauthorized,
    authMiddleware,
} from "@/middlewares/index";

export default class RiderController implements Controller {
    public authPath = "/auth/riders";
    public path = "/riders";
    public router = Router();
    private riderService = new RiderService();

    constructor() {
        this.initializeRoutes();
    }

    private initializeRoutes(): void {
        this.router.post(
            `${this.authPath}/register`,
            validateData(validate.register),
            asyncHandler(this.register),
        );

        this.router.post(
            `${this.authPath}/verify-otp`,
            validateData(validate.verifyOtp),
            asyncHandler(this.registrationOTP),
        );

        this.router.post(
            `${this.authPath}/forgot`,
            validateData(validate.forgetPwd),
            asyncHandler(this.forgotPassword),
        );
        this.router.post(
            `${this.authPath}/password/verify-otp`,
            validateData(validate.verifyOtp),
            asyncHandler(this.resetPasswordOTP),
        );
        this.router.post(
            `${this.authPath}/password/reset`,
            validateData(validate.resetPassword),
            asyncHandler(this.resetPassword),
        );
    }

    private register = async (
        req: Request,
        res: Response,
        next: NextFunction,
    ): Promise<void> => {
        const { name, email, password, role } = req.body;
        const result = await this.riderService.register({
            name,
            email,
            password,
            role,
        });
        sendJsonResponse(
            res,
            201,
            "Registration initiated. Please verify your email with the OTP sent.",
            result,
        );
    };

    private registrationOTP = async (
        req: Request,
        res: Response,
        next: NextFunction,
    ): Promise<void> => {
        const { otp } = req.body;
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            throw new BadRequest("Authorization token is required");
        }

        if (!otp) {
            throw new BadRequest("OTP code is required");
        }

        const token = authHeader.split(" ")[1];

        const decoded = await TokenService.verifyEmailToken(token);

        const user = await this.riderService.verifyRegistrationOTP(
            decoded.userId.toString(),
            otp,
        );

        sendJsonResponse(
            res,
            200,
            "Email verified successfully. You can now log in.",
        );
    };

    private forgotPassword = async (
        req: Request,
        res: Response,
        next: NextFunction,
    ): Promise<void> => {
        const { email } = req.body;
        const resetToken = await this.riderService.forgotPassword(email);
        sendJsonResponse(
            res,
            200,
            "Reset token generated and OTP sent to your email.",
            resetToken,
        );
    };

    private resetPasswordOTP = async (
        req: Request,
        res: Response,
        next: NextFunction,
    ): Promise<void> => {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            throw new BadRequest("Authorization token is required");
        }

        const resetToken = authHeader.split(" ")[1];
        const { otp } = req.body;

        if (!otp) {
            throw new BadRequest("OTP is required");
        }

        await this.riderService.verifyResetPasswordOTP(resetToken, otp);
        sendJsonResponse(
            res,
            200,
            "OTP verified successfully. You can now reset your password.",
        );
    };

    private resetPassword = async (
        req: Request,
        res: Response,
        next: NextFunction,
    ): Promise<void> => {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            throw new BadRequest("Authorization token is required");
        }

        const resetToken = authHeader.split(" ")[1];
        const { newPassword } = req.body;

        if (!newPassword) {
            throw new BadRequest("New password is required");
        }

        await this.riderService.resetPassword(resetToken, newPassword);
        sendJsonResponse(res, 200, "Password reset successfully.");
    };
}
