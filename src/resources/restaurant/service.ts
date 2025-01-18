import RestaurantModel from '@/resources/restaurant/model';
import { TokenService, addEmailToQueue } from '@/utils/index';
import { CloudinaryService } from '@/config/index';
import bcrypt from 'bcryptjs';
import {
    IRestaurant,
    RegisterRestaurantto,
    Address,
    UploadedImage,
    RegistrationResponse,
} from '@/resources/restaurant/interface';
import { UserRoles, LoginCredentials } from '@/types/index';
import {
    sendOTPByEmail,
    pendingVerificationEmail,
    PasswordResetEmail,
} from '@/resources/restaurant/email-template';
import {
    asyncHandler,
    Conflict,
    ResourceNotFound,
    BadRequest,
    Forbidden,
    Unauthorized,
    authMiddleware,
} from '@/middlewares/index';

export class RestaurantService {
    private cloudinaryService: CloudinaryService;
    constructor() {
        this.cloudinaryService = new CloudinaryService();
    }
    private restaurant = RestaurantModel;

    private async checkDuplicateEmail(email: string): Promise<void> {
        const existingRestaurant = await this.restaurant.findOne({ email });
        if (existingRestaurant) {
            throw new Conflict('Email already registered!');
        }
    }

    private async checkDuplicateAddress(address: Address): Promise<void> {
        if (!address) return;

        const duplicateAddress = await this.restaurant.findOne({
            'address.street': address.street,
            'address.city': address.city,
            'address.state': address.state,
        });

        if (duplicateAddress) {
            throw new Conflict(
                'Duplicate address: This address already exists.',
            );
        }
    }

    private sanitizeRestaurant(restaurant: IRestaurant): Partial<IRestaurant> {
        return {
            _id: restaurant._id,
            name: restaurant.name,
            email: restaurant.email,
            isEmailVerified: restaurant.isEmailVerified,
            createdAt: restaurant.createdAt,
            updatedAt: restaurant.updatedAt,
        };
    }

    public async register(
        restaurantData: RegisterRestaurantto,
        file?: Express.Multer.File,
    ): Promise<RegistrationResponse> {
        // Validate unique constraints
        await Promise.all([
            this.checkDuplicateEmail(restaurantData.email),
            this.checkDuplicateAddress(restaurantData.address),
        ]);

        // Handle image uploads if present
        let businessLicense: UploadedImage | undefined;
        if (file) {
            const uploadResult = await this.cloudinaryService.uploadImage(file);
            businessLicense = {
                imageId: uploadResult.imageId,
                imageUrl: uploadResult.imageUrl,
            };
        }

        // Create restaurant
        const restaurant = await this.restaurant.create({
            ...restaurantData,
            businessLicense,
            status: 'inactive',
            isEmailVerified: false,
        });

        const verificationResult =
            await restaurant.generateEmailVerificationOTP();
        const { otp, verificationToken } = verificationResult;
        await restaurant.save();

        const emailOptions = sendOTPByEmail(restaurant as IRestaurant, otp);
        await addEmailToQueue(emailOptions);

        return {
            restaurant: this.sanitizeRestaurant(restaurant),
            verificationToken,
        };
    }

    public async verifyRegistrationOTP(
        userId: string,
        otp: string,
    ): Promise<IRestaurant> {
        const restaurant = await this.restaurant.findOne({
            _id: userId,
            isEmailVerified: false,
            'emailVerificationOTP.expiresAt': { $gt: new Date() },
        });

        if (!restaurant) {
            throw new BadRequest('Invalid or expired verification session');
        }

        if (!restaurant?.emailVerificationOTP?.otp) {
            throw new BadRequest('No OTP found for this restaurant');
        }

        if (new Date() > restaurant.emailVerificationOTP.expiresAt) {
            throw new BadRequest('OTP has expired');
        }

        const isValid = await bcrypt.compare(
            otp,
            restaurant.emailVerificationOTP.otp.toString(),
        );
        if (!isValid) {
            throw new BadRequest('Invalid OTP');
        }

        restaurant.emailVerificationOTP = undefined;
        restaurant.isEmailVerified = true;
        await restaurant.save();

        const emailOptions = pendingVerificationEmail(
            restaurant as IRestaurant,
        );
        await addEmailToQueue(emailOptions);

        return restaurant;
    }

    public async forgotPassword(email: string): Promise<string> {
        const restaurant = await this.restaurant.findOne({
            email: email.toLowerCase().trim(),
        });
        if (!restaurant) {
            throw new ResourceNotFound('Restaurant not found');
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
            'emailVerificationOTP.verificationToken': verificationToken,
            'emailVerificationOTP.expiresAt': { $gt: new Date() },
        });

        if (!restaurant) {
            throw new BadRequest('Invalid or expired reset token');
        }

        if (!restaurant.emailVerificationOTP?.otp) {
            throw new BadRequest('No OTP found for this restaurant');
        }

        if (new Date() > restaurant.emailVerificationOTP.expiresAt) {
            throw new BadRequest('OTP has expired');
        }

        const isValid = await bcrypt.compare(
            otp,
            restaurant.emailVerificationOTP.otp.toString(),
        );
        if (!isValid) {
            throw new BadRequest('Invalid OTP');
        }

        return restaurant;
    }

    public async resetPassword(
        verificationToken: string,
        newPassword: string,
    ): Promise<void> {
        const restaurant = await this.restaurant.findOne({
            'emailVerificationOTP.verificationToken': verificationToken,
            'emailVerificationOTP.expiresAt': { $gt: new Date() },
        });

        if (!restaurant) {
            throw new BadRequest('Invalid or expired reset token');
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

    public async login(
        credentials: LoginCredentials,
    ): Promise<{ restaurant: IRestaurant; token: string }> {
        const restaurant = await this.restaurant.findOne({
            email: credentials.email,
        });
        if (!restaurant) {
            throw new ResourceNotFound('Invalid email or password');
        }

        if (!restaurant.isEmailVerified) {
            throw new Forbidden('Verify your email before sign in.');
        }

        const isValid = await restaurant.comparePassword(credentials.password);
        if (!isValid) {
            restaurant.failedLoginAttempts += 1;
            if (restaurant.failedLoginAttempts >= 3) {
                restaurant.isLocked = true;
                await restaurant.save();
                throw new Forbidden(
                    'Your account has been locked due to multiple failed login attempts. Please reset your password.',
                );
            }
            await restaurant.save();
            throw new Unauthorized('Invalid email or password');
        }

        restaurant.failedLoginAttempts = 0;
        await restaurant.save();

        // If no specific role is provided, default to 'user' role
        const requestedRole = credentials.roles || 'restaurant_owner';
        if (!restaurant.roles.includes(requestedRole)) {
            throw new Forbidden(
                `You do not have permission to sign in as ${requestedRole}`,
            );
        }

        const token = TokenService.createAuthToken({
            userId: restaurant._id.toString(),
            roles: restaurant.roles,
        });

        return { restaurant, token };
    }

    public async createRestaurant(
        restaurantData: RegisterRestaurantto,
        file?: Express.Multer.File,
    ): Promise<RegistrationResponse> {
        // Validate unique constraints
        await Promise.all([
            this.checkDuplicateEmail(restaurantData.email),
            this.checkDuplicateAddress(restaurantData.address),
        ]);

        let businessLicense: UploadedImage | undefined;
        if (file) {
            const uploadResult = await this.cloudinaryService.uploadImage(file);
            businessLicense = {
                imageId: uploadResult.imageId,
                imageUrl: uploadResult.imageUrl,
            };
        }

        const restaurant = await this.restaurant.create({
            ...restaurantData,
            businessLicense,
            status: 'inactive',
            isEmailVerified: false,
        });
        await restaurant.save();

        const emailOptions = pendingVerificationEmail(
            restaurant as IRestaurant,
        );
        await addEmailToQueue(emailOptions);

        return {
            restaurant: this.sanitizeRestaurant(restaurant),
        };
    }
}
