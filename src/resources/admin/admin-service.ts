import AdminModel from '@/resources/admin/admin-model';
import { TokenService, addEmailToQueue } from '@/utils/index';
import { LoginCredentials } from '@/types/index';
import bcrypt from 'bcryptjs';
import UserModel from '@/resources/user/user-model';
import RestaurantModel from '@/resources/restaurant/model';
import RiderModel from '@/resources/rider/rider-model';
import {
    sendOTPByEmail,
    welcomeEmail,
    PasswordResetEmail,
} from '@/resources/admin/admin-email-template';
import {
    IAdmin,
    RegisterAdminto,
    loginResponse,
    RegistrationResponse,
} from '@/resources/admin/admin-interface';
import {
    asyncHandler,
    Conflict,
    ResourceNotFound,
    BadRequest,
    Forbidden,
    Unauthorized,
    authMiddleware,
} from '@/middlewares/index';

export class AdminService {
    private admin = AdminModel;
    private user = UserModel;
    private restaurant = RestaurantModel;
    private rider = RiderModel;

    public async register(
        adminData: RegisterAdminto,
    ): Promise<RegistrationResponse> {
        const existingAdmin = await this.admin.findOne({
            email: adminData.email,
        });
        if (existingAdmin) {
            throw new Conflict('Email already registered!');
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
            'emailVerificationOTP.expiresAt': { $gt: new Date() },
        });

        if (!admin) {
            throw new BadRequest('Invalid or expired verification session');
        }

        if (!admin?.emailVerificationOTP?.otp) {
            throw new BadRequest('No OTP found for this admin');
        }

        if (new Date() > admin.emailVerificationOTP.expiresAt) {
            throw new BadRequest('OTP has expired');
        }

        const isValid = await bcrypt.compare(
            otp,
            admin.emailVerificationOTP.otp.toString(),
        );
        if (!isValid) {
            throw new BadRequest('Invalid OTP');
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
            throw new ResourceNotFound('Admin not found');
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
            'emailVerificationOTP.verificationToken': verificationToken,
            'emailVerificationOTP.expiresAt': { $gt: new Date() },
        });

        if (!admin) {
            throw new BadRequest('Invalid or expired reset token');
        }

        if (!admin.emailVerificationOTP?.otp) {
            throw new BadRequest('No OTP found for this admin');
        }

        if (new Date() > admin.emailVerificationOTP.expiresAt) {
            throw new BadRequest('OTP has expired');
        }

        const isValid = await bcrypt.compare(
            otp,
            admin.emailVerificationOTP.otp.toString(),
        );
        if (!isValid) {
            throw new BadRequest('Invalid OTP');
        }

        return admin;
    }

    public async resetPassword(
        verificationToken: string,
        newPassword: string,
    ): Promise<void> {
        const admin = await this.admin.findOne({
            'emailVerificationOTP.verificationToken': verificationToken,
            'emailVerificationOTP.expiresAt': { $gt: new Date() },
        });

        if (!admin) {
            throw new BadRequest('Invalid or expired reset token');
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

    public async login(credentials: LoginCredentials): Promise<loginResponse> {
        const admin = await this.admin.findOne({
            email: credentials.email,
        });
        if (!admin) {
            throw new ResourceNotFound('Invalid email or password');
        }

        if (!admin.isEmailVerified) {
            throw new Forbidden('Verify your email before sign in.');
        }

        const isValid = await admin.comparePassword(credentials.password);
        if (!isValid) {
            admin.failedLoginAttempts += 1;
            if (admin.failedLoginAttempts >= 3) {
                admin.isLocked = true;
                await admin.save();
                throw new Forbidden(
                    'Your account has been locked due to multiple failed login attempts. Please reset your password.',
                );
            }
            await admin.save();
            throw new Unauthorized('Invalid email or password');
        }

        admin.failedLoginAttempts = 0;
        await admin.save();

        const requestedRole = credentials.role || 'admin';
        if (!admin.role.includes(requestedRole)) {
            throw new Forbidden(
                `You do not have permission to sign in as ${requestedRole}`,
            );
        }

        const token = TokenService.createAuthToken({
            userId: admin._id.toString(),
            role: admin.role,
        });

        return { admin, token };
    }

    public async fetchAllUsers(): Promise<any> {
        const users = await this.user.find({
            attributes: ['name', 'email', 'role'],
        });
        return users;
    }

    public async fetchUserById(userId: string): Promise<any> {
        const user = await this.user.findById(userId);
        if (!user) {
            throw new ResourceNotFound('User not found');
        }
        return user;
    }

    public async deleteUser(userId: string): Promise<any> {
        const user = await this.user.findByIdAndDelete(userId);
        if (!user) {
            throw new Error('User not found');
        }
        return user;
    }

    public async fetchAllRestaurants(): Promise<any> {
        const restaurants = await this.restaurant.find({
            attributes: ['name', 'email', 'ownerId'],
        });
        return restaurants;
    }

    public async fetchRestaurantById(userId: string): Promise<any> {
        const restaurant = await this.restaurant.findById(userId);
        if (!restaurant) {
            throw new ResourceNotFound('Restaurant not found');
        }
        return restaurant;
    }

    public async deleteRestaurant(userId: string): Promise<any> {
        const restaurant = await this.restaurant.findByIdAndDelete(userId);
        if (!restaurant) {
            throw new Error('Restaurant not found');
        }
        return restaurant;
    }

    public async fetchAllRiders(): Promise<any> {
        const riders = await this.rider.find({
            attributes: ['name', 'email', 'role'],
        });
        return riders;
    }

    public async fetchRiderById(userId: string): Promise<any> {
        const rider = await this.rider.findById(userId);
        if (!rider) {
            throw new ResourceNotFound('Rider not found');
        }
        return rider;
    }

    public async deleteRider(userId: string): Promise<any> {
        const rider = await this.rider.findByIdAndDelete(userId);
        if (!rider) {
            throw new Error('Rider not found');
        }
        return rider;
    }
}
