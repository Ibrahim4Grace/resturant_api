import RestaurantModel from "@/resources/restaurant/restaurant-model";
import { addEmailToQueue } from "@/utils/index";
import {
    IRestaurant,
    RegisterRestaurantto,
} from "@/resources/restaurant/restaurant-interface";
import { UserRoles } from "@/types/index";
import bcrypt from "bcryptjs";
import {
    sendOTPByEmail,
    welcomeEmail,
    PasswordResetEmail,
} from "@/resources/restaurant/restaurant-email-template";
import {
    asyncHandler,
    Conflict,
    ResourceNotFound,
    BadRequest,
    Forbidden,
    Unauthorized,
    authMiddleware,
} from "@/middlewares/index";

export class RestaurantService {
    private restaurant = RestaurantModel;

    public async register(restaurantData: RegisterRestaurantto): Promise<{
        restaurant: Partial<IRestaurant>;
        verificationToken: string;
    }> {
        const existingRestaurant = await this.restaurant.findOne({
            email: restaurantData.email,
        });
        if (existingRestaurant) {
            throw new Conflict("Email already registered!");
        }

        const restaurant = await this.restaurant.create({
            ...restaurantData,
            isEmailVerified: false,
        });

        const verificationResult =
            await restaurant.generateEmailVerificationOTP();
        const { otp, verificationToken } = verificationResult;
        await restaurant.save();

        const emailOptions = sendOTPByEmail(restaurant as IRestaurant, otp);
        await addEmailToQueue(emailOptions);

        const sanitizedRestaurant: Partial<IRestaurant> = {
            _id: restaurant._id,
            name: restaurant.name,
            email: restaurant.email,
            isEmailVerified: restaurant.isEmailVerified,
            createdAt: restaurant.createdAt,
            updatedAt: restaurant.updatedAt,
        };

        return {
            restaurant: sanitizedRestaurant,
            verificationToken: verificationToken,
        };
    }

    public async verifyRegistrationOTP(
        userId: string,
        otp: string,
    ): Promise<IRestaurant> {
        const restaurant = await this.restaurant.findOne({
            _id: userId,
            isEmailVerified: false,
            "emailVerificationOTP.expiresAt": { $gt: new Date() },
        });

        if (!restaurant) {
            throw new BadRequest("Invalid or expired verification session");
        }

        if (!restaurant?.emailVerificationOTP?.otp) {
            throw new BadRequest("No OTP found for this restaurant");
        }

        if (new Date() > restaurant.emailVerificationOTP.expiresAt) {
            throw new BadRequest("OTP has expired");
        }

        const isValid = await bcrypt.compare(
            otp,
            restaurant.emailVerificationOTP.otp.toString(),
        );
        if (!isValid) {
            throw new BadRequest("Invalid OTP");
        }

        restaurant.emailVerificationOTP = undefined;
        restaurant.isEmailVerified = true;
        await restaurant.save();

        const emailOptions = welcomeEmail(restaurant as IRestaurant);
        await addEmailToQueue(emailOptions);

        return restaurant;
    }

    public async forgotPassword(email: string): Promise<string> {
        const restaurant = await this.restaurant.findOne({
            email: email.toLowerCase().trim(),
        });
        if (!restaurant) {
            throw new ResourceNotFound("Restaurant not found");
        }

        const verificationResult =
            await restaurant.generateEmailVerificationOTP();
        const { otp, verificationToken } = verificationResult;
        await restaurant.save();

        const emailOptions = sendOTPByEmail(restaurant as IRestaurant, otp);
        await addEmailToQueue(emailOptions);

        return verificationToken;
    }

    public async verifyResetPasswordOTP(
        verificationToken: string,
        otp: string,
    ): Promise<IRestaurant> {
        const restaurant = await this.restaurant.findOne({
            "emailVerificationOTP.verificationToken": verificationToken,
            "emailVerificationOTP.expiresAt": { $gt: new Date() },
        });

        if (!restaurant) {
            throw new BadRequest("Invalid or expired reset token");
        }

        if (!restaurant.emailVerificationOTP?.otp) {
            throw new BadRequest("No OTP found for this restaurant");
        }

        if (new Date() > restaurant.emailVerificationOTP.expiresAt) {
            throw new BadRequest("OTP has expired");
        }

        const isValid = await bcrypt.compare(
            otp,
            restaurant.emailVerificationOTP.otp.toString(),
        );
        if (!isValid) {
            throw new BadRequest("Invalid OTP");
        }

        return restaurant;
    }

    public async resetPassword(
        verificationToken: string,
        newPassword: string,
    ): Promise<void> {
        const restaurant = await this.restaurant.findOne({
            "emailVerificationOTP.verificationToken": verificationToken,
            "emailVerificationOTP.expiresAt": { $gt: new Date() },
        });

        if (!restaurant) {
            throw new BadRequest("Invalid or expired reset token");
        }

        restaurant.passwordHistory = restaurant.passwordHistory ?? [];
        restaurant.passwordHistory.push({
            password: restaurant.password,
            changedAt: new Date(),
        });

        restaurant.password = newPassword;
        restaurant.emailVerificationOTP = undefined;
        await restaurant.save();

        const emailOptions = PasswordResetEmail(restaurant as IRestaurant);
        await addEmailToQueue(emailOptions);
    }
}
