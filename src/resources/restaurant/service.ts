import RestaurantModel from '@/resources/restaurant/model';
import UserModel from '@/resources/user/user-model';
import { CloudinaryService } from '@/config/index';
import bcrypt from 'bcryptjs';
import { LoginCredentials, UploadedImage } from '@/types/index';
import {
    IRestaurant,
    RegisterRestaurantto,
    Address,
    RegistrationResponse,
    RestaurantCreationResponse,
    ISanitizedRestaurant,
} from '@/resources/restaurant/interface';
import {
    sendOTPByEmail,
    pendingVerificationEmail,
    PasswordResetEmail,
} from '@/resources/restaurant/email-template';
import {
    TokenService,
    EmailQueueService,
    withCachedData,
    CACHE_TTL,
} from '@/utils/index';
import {
    Conflict,
    ResourceNotFound,
    BadRequest,
    Forbidden,
    Unauthorized,
} from '@/middlewares/index';

export class RestaurantService {
    private restaurant = RestaurantModel;
    private user = UserModel;

    private cloudinaryService: CloudinaryService;
    constructor() {
        this.cloudinaryService = new CloudinaryService();
    }

    private readonly CACHE_KEYS = {
        ALL_RESTAURANTS: 'all_restaurants',
        RESTAURANT_BY_ID: (id: string) => `restaurant:${id}`,
    };
    private async checkDuplicateEmail(email: string): Promise<void> {
        const existingRestaurant = await this.restaurant.findOne({ email });
        if (existingRestaurant) {
            throw new Conflict('Email already registered!');
        }
    }

    private async checkDuplicatePhone(phone: string): Promise<void> {
        const existingRestaurant = await this.restaurant.findOne({ phone });
        if (existingRestaurant) {
            throw new Conflict('Phone number already registered!');
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

    private sanitizeRestaurant(restaurant: IRestaurant): ISanitizedRestaurant {
        return {
            _id: restaurant._id,
            name: restaurant.name,
            email: restaurant.email,
            phone: restaurant.phone,
            address: restaurant.address,
            cuisine: restaurant.cuisine,
            status: restaurant.status,
            operatingHours: restaurant.operatingHours,
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
            this.checkDuplicatePhone(restaurantData.phone),
            this.checkDuplicateAddress(restaurantData.address),
        ]);

        // Create a user account for the unauthenticated user
        const user = await this.user.create({
            name: restaurantData.name,
            email: restaurantData.email,
            password: restaurantData.password,
            phone: restaurantData.phone,
            isEmailVerified: true,
        });

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
            ownerId: user._id,
            status: 'pending',
            isEmailVerified: false,
        });

        const verificationResult =
            await restaurant.generateEmailVerificationOTP();
        const { otp, verificationToken } = verificationResult;
        await restaurant.save();

        const emailOptions = sendOTPByEmail(restaurant as IRestaurant, otp);
        await EmailQueueService.addEmailToQueue(emailOptions);

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
        await EmailQueueService.addEmailToQueue(emailOptions);

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
        await EmailQueueService.addEmailToQueue(emailOptions);

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
        await EmailQueueService.addEmailToQueue(emailOptions);
    }

    public async login(
        credentials: LoginCredentials,
    ): Promise<{ restaurant: ISanitizedRestaurant; token: string }> {
        const restaurant = await this.restaurant.findOne({
            email: credentials.email,
        });
        if (!restaurant) {
            throw new ResourceNotFound('Invalid email or password');
        }

        if (!restaurant.isEmailVerified) {
            throw new Forbidden('Verify your email before sign in.');
        }

        if (restaurant.status !== 'active') {
            throw new Forbidden(
                'Your account is not active. Please contact support or wait for approval.',
            );
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

        const requestedRole = 'restaurant_owner';
        if (!restaurant.role.includes(requestedRole)) {
            throw new Forbidden(
                `You do not have permission to sign in as ${requestedRole}`,
            );
        }

        const token = TokenService.createAuthToken({
            userId: restaurant._id,
            role: requestedRole,
        });

        return {
            restaurant: this.sanitizeRestaurant(restaurant),
            token,
        };
    }

    public async createRestaurant(
        restaurantData: RegisterRestaurantto,
        file?: Express.Multer.File,
    ): Promise<RestaurantCreationResponse> {
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
            status: 'pending',
            isEmailVerified: true,
        });

        const emailOptions = pendingVerificationEmail(
            restaurant as IRestaurant,
        );
        await EmailQueueService.addEmailToQueue(emailOptions);

        const restaurantToken = TokenService.createAuthToken({
            userId: restaurant._id,
            role: restaurant.role,
        });

        return {
            restaurant: this.sanitizeRestaurant(restaurant),
            token: restaurantToken,
        };
    }

    public async getRestaurant(
        restaurantId: string,
    ): Promise<ISanitizedRestaurant> {
        const cacheKey = this.CACHE_KEYS.RESTAURANT_BY_ID(restaurantId);

        return withCachedData<ISanitizedRestaurant>(
            cacheKey,
            async () => {
                const restaurant = await this.restaurant
                    .findById(restaurantId)
                    .lean();

                if (!restaurant) {
                    throw new ResourceNotFound('Restaurant not found');
                }

                return this.sanitizeRestaurant(restaurant);
            },
            CACHE_TTL.ONE_HOUR,
        );
    }

    public async updateRestaurant(
        restaurantId: string,
        data: Partial<IRestaurant>,
    ): Promise<Partial<IRestaurant> | null> {
        const restaurant = await this.restaurant.findOneAndUpdate(
            { _id: restaurantId },
            { $set: data },
            { new: true },
        );

        if (!restaurant) {
            return null;
        }

        return this.sanitizeRestaurant(restaurant);
    }
}
