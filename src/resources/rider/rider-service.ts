import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import RiderModel from '../../resources/rider/rider-model';
import OrderModel from '../../resources/order/order-model';
import UserModel from '../../resources/user/user-model';
import { IOrder } from '../../resources/order/order-interface';
import { orderStatusUpdateEmail } from '../../resources/order/order-email-template';
import { riderAssignedEmail } from '../../resources/rider/rider-email-template';
import { CloudinaryService } from '../../config/index';
import {
    EmailQueueService,
    TokenService,
    getPaginatedAndCachedResults,
    withCachedData,
    CACHE_TTL,
} from '../../utils/index';
import {
    UploadedImage,
    LoginCredentials,
    IPaginationResponse,
    IPaginatedEntityResponse,
    IOrderPaginatedResponse,
} from '../../types/index';
import {
    IRider,
    RegisterRiderto,
    loginResponse,
    UpdateOrderStatusParams,
} from '../../resources/rider/rider-interface';
import {
    sendOTPByEmail,
    welcomeEmail,
    PasswordResetEmail,
} from '../../resources/rider/rider-email-template';
import {
    Conflict,
    ResourceNotFound,
    BadRequest,
    Forbidden,
    Unauthorized,
    ServerError,
} from '../../middlewares/index';

export class RiderService {
    private rider = RiderModel;
    private order = OrderModel;
    private user = UserModel;
    private readonly ALLOWED_RIDER_STATUSES = 'delivered' as const;
    private readonly CACHE_KEYS = {
        RIDER_BY_ID: (id: string) => `rider:${id}`,
        RIDER_DELIVERY_BY_ID: (riderId: string, deliveryId: string) =>
            `rider:${riderId}:delivery:${deliveryId}`,
    };
    private cloudinaryService: CloudinaryService;
    constructor() {
        this.cloudinaryService = new CloudinaryService();
    }

    private async checkDuplicate(
        field: 'email' | 'phone',
        value: string,
    ): Promise<void> {
        const existingRider = await this.rider.findOne({ [field]: value });
        if (existingRider) {
            throw new Conflict(
                `${field === 'email' ? 'Email' : 'Phone Number'} already registered!`,
            );
        }
    }
    private async findRiderById(riderId: string): Promise<IRider> {
        const rider = await this.rider.findById(riderId).lean();
        if (!rider) {
            throw new ResourceNotFound('Rider not found');
        }
        return rider;
    }
    private async findRiderByEmail(email: string) {
        return this.rider.findOne({
            email: email.toLowerCase().trim(),
        });
    }
    private async findRiderByVerificationToken(verificationToken: string) {
        return this.rider.findOne({
            'emailVerificationOTP.verificationToken': verificationToken,
            'emailVerificationOTP.expiresAt': { $gt: new Date() },
        });
    }

    private riderData(rider: IRider): Partial<IRider> {
        return {
            _id: rider._id,
            name: rider.name,
            email: rider.email,
            phone: rider.phone,
            address: rider.address,
            role: rider.role,
            createdAt: rider.createdAt,
            updatedAt: rider.updatedAt,
        };
    }

    private async checkOrderAssignment(
        orderId: string,
        riderId: string,
    ): Promise<void> {
        const order = await this.order.findOne({
            _id: orderId,
            'delivery_info.riderId': riderId,
        });
        if (!order) {
            throw new ResourceNotFound(
                'Order not found or not assigned to this rider',
            );
        }
    }
    private sanitizeOrder(order: IOrder): Partial<IOrder> {
        return {
            _id: order._id,
            order_number: order.order_number,
            status: order.status,
            total_price: order.total_price,
            userId: order.userId,
            restaurantId: order.restaurantId,
            items: order.items,
            subtotal: order.subtotal,
            tax: order.tax,
            delivery_fee: order.delivery_fee,
            delivery_info: order.delivery_info,
            createdAt: order.createdAt,
            updatedAt: order.updatedAt,
        };
    }

    public async register(
        riderData: RegisterRiderto,
        file?: Express.Multer.File,
    ): Promise<{ rider: Partial<IRider>; verificationToken: string }> {
        await Promise.all([
            this.checkDuplicate('email', riderData.email),
            this.checkDuplicate('phone', riderData.phone),
        ]);

        let licenseImage: UploadedImage | undefined;
        if (file) {
            const uploadResult = await this.cloudinaryService.uploadImage(file);
            licenseImage = {
                imageId: uploadResult.imageId,
                imageUrl: uploadResult.imageUrl,
            };
        }

        const rider = await this.rider.create({
            ...riderData,
            licenseImage,
            isEmailVerified: false,
        });

        const verificationResult = await rider.generateEmailVerificationOTP();
        const { otp, verificationToken } = verificationResult;
        await rider.save();

        const emailOptions = sendOTPByEmail(rider as IRider, otp);
        await EmailQueueService.addEmailToQueue(emailOptions);

        return {
            rider: this.riderData(rider),
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
            'emailVerificationOTP.expiresAt': { $gt: new Date() },
        });

        if (!rider) {
            throw new BadRequest('Invalid or expired verification session');
        }

        if (!rider?.emailVerificationOTP?.otp) {
            throw new BadRequest('No OTP found for this rider');
        }

        if (new Date() > rider.emailVerificationOTP.expiresAt) {
            throw new BadRequest('OTP has expired');
        }

        const isValid = await bcrypt.compare(
            otp,
            rider.emailVerificationOTP.otp.toString(),
        );
        if (!isValid) {
            throw new BadRequest('Invalid OTP');
        }

        rider.emailVerificationOTP = undefined;
        rider.isEmailVerified = true;
        await rider.save();

        const emailOptions = welcomeEmail(rider as IRider);
        await EmailQueueService.addEmailToQueue(emailOptions);

        return rider;
    }

    public async forgotPassword(email: string): Promise<string> {
        const rider = await this.findRiderByEmail(email);
        if (!rider) {
            throw new ResourceNotFound('Rider not found');
        }

        const verificationResult = await rider.generateEmailVerificationOTP();
        const { otp, verificationToken } = verificationResult;
        await rider.save();

        const emailOptions = sendOTPByEmail(rider as IRider, otp);
        await EmailQueueService.addEmailToQueue(emailOptions);

        return verificationToken;
    }

    public async verifyResetPasswordOTP(
        verificationToken: string,
        otp: string,
    ): Promise<IRider> {
        const rider =
            await this.findRiderByVerificationToken(verificationToken);
        if (!rider) {
            throw new BadRequest('Invalid or expired reset token');
        }

        if (!rider.emailVerificationOTP?.otp) {
            throw new BadRequest('No OTP found for this rider');
        }

        if (new Date() > rider.emailVerificationOTP.expiresAt) {
            throw new BadRequest('OTP has expired');
        }

        const isValid = await bcrypt.compare(
            otp,
            rider.emailVerificationOTP.otp.toString(),
        );
        if (!isValid) {
            throw new BadRequest('Invalid OTP');
        }

        return rider;
    }

    public async resetPassword(
        verificationToken: string,
        newPassword: string,
    ): Promise<void> {
        const rider =
            await this.findRiderByVerificationToken(verificationToken);
        if (!rider) {
            throw new BadRequest('Invalid or expired reset token');
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
        await EmailQueueService.addEmailToQueue(emailOptions);
    }

    public async login(credentials: LoginCredentials): Promise<loginResponse> {
        const rider = await this.findRiderByEmail(credentials.email);
        if (!rider) {
            throw new ResourceNotFound('Invalid email or password');
        }

        if (!rider.isEmailVerified) {
            throw new Forbidden('Verify your email before sign in.');
        }

        const isValid = await rider.comparePassword(credentials.password);
        if (!isValid) {
            rider.failedLoginAttempts += 1;
            if (rider.failedLoginAttempts >= 3) {
                rider.isLocked = true;
                await rider.save();
                throw new Forbidden(
                    'Your account has been locked due to multiple failed login attempts. Please reset your password.',
                );
            }
            await rider.save();
            throw new Unauthorized('Invalid email or password');
        }

        rider.failedLoginAttempts = 0;
        await rider.save();

        const requestedRole = credentials.role || 'rider';
        if (!rider.role.includes(requestedRole)) {
            throw new Forbidden(
                `You do not have permission to sign in as ${requestedRole}`,
            );
        }

        const token = TokenService.createAuthToken({
            userId: rider._id,
            role: rider.role,
        });

        return {
            rider: this.riderData(rider),
            token,
        };
    }

    public async getRiderById(riderId: string): Promise<Partial<IRider>> {
        const rider = await this.findRiderById(riderId);
        return this.riderData(rider);
    }

    public async updateRiderById(
        riderId: string,
        data: Partial<IRider>,
    ): Promise<Partial<IRider>> {
        const rider = await this.rider.findOneAndUpdate(
            { _id: riderId },
            { $set: data },
            { new: true },
        );

        return this.riderData(rider);
    }

    public async getReadytToPickOrder(
        paginatedResults: IPaginatedEntityResponse<IOrder>,
    ): Promise<{
        results: Partial<IOrder>[];
        pagination: IPaginationResponse;
    }> {
        if (!paginatedResults) {
            throw new ServerError('Pagination results not found');
        }

        const sanitizedResults = paginatedResults.results.map((order) =>
            this.sanitizeOrder(order),
        );

        return {
            results: sanitizedResults,
            pagination: paginatedResults.pagination,
        };
    }

    public async claimOrder(
        riderId: string,
        orderId: string,
    ): Promise<Partial<IOrder>> {
        const [order, rider] = await Promise.all([
            this.order.findOne({
                _id: orderId,
                status: 'ready_for_pickup',
            }),
            this.rider.findById(riderId),
        ]);
        if (!order) {
            throw new ResourceNotFound(
                'Order not found or not ready for pickup',
            );
        }
        if (!rider) {
            throw new ResourceNotFound('Rider not found');
        }
        if (rider.status !== 'available') {
            throw new BadRequest(`Rider is currently ${rider.status}`);
        }

        const updatedOrder = await this.order.findByIdAndUpdate(
            orderId,
            {
                status: 'shipped',
                'delivery_info.riderId': rider._id,
                'delivery_info.rider_name': rider.name,
            },
            { new: true },
        );

        if (!updatedOrder) {
            throw new ResourceNotFound('Order not found');
        }

        await this.rider.findByIdAndUpdate(riderId, { status: 'busy' });

        const user = await this.user.findById(updatedOrder.userId);
        if (user) {
            const emailOptions = riderAssignedEmail(user, updatedOrder);
            await EmailQueueService.addEmailToQueue(emailOptions);
        }

        return this.sanitizeOrder(updatedOrder);
    }

    public async updateOrderStatus(
        params: UpdateOrderStatusParams,
    ): Promise<Partial<IOrder>> {
        const { riderId, orderId, status } = params;

        if (!this.ALLOWED_RIDER_STATUSES.includes(status as any)) {
            throw new BadRequest(
                `Riders can only update status to: ${this.ALLOWED_RIDER_STATUSES}`,
            );
        }

        // Verify rider is assigned to this order
        await this.checkOrderAssignment(orderId, riderId);

        // Get current order to check status transition
        const currentOrder = await this.order.findById(orderId);
        if (!currentOrder) {
            throw new ResourceNotFound('Order not found');
        }

        if (status === 'delivered' && currentOrder.status !== 'shipped') {
            throw new BadRequest(
                'Order must be shipped before being delivered',
            );
        }

        const rider = await this.rider.findById(riderId);
        if (!rider) {
            throw new ResourceNotFound('Rider not found');
        }

        if (rider.status !== 'busy') {
            throw new BadRequest(
                'Rider must be in busy status to update orders',
            );
        }

        const updatedOrder = await this.order.findByIdAndUpdate(
            orderId,
            {
                status,
                ...(status === 'delivered' && {
                    'delivery_info.estimatedDeliveryTime': new Date(),
                }),
            },
            { new: true },
        );

        if (!updatedOrder) {
            throw new ResourceNotFound('Order not found');
        }
        if (status === 'delivered') {
            await this.rider.findByIdAndUpdate(riderId, {
                status: 'available',
            });
        }

        const user = await this.user.findById(updatedOrder.userId);
        if (user) {
            const emailOptions = orderStatusUpdateEmail(user, updatedOrder);
            await EmailQueueService.addEmailToQueue(emailOptions);
        }

        return this.sanitizeOrder(updatedOrder);
    }

    public async getRiderDeliveries(
        req: Request,
        res: Response,
        riderId: string,
    ): Promise<IOrderPaginatedResponse> {
        const paginatedResults = await getPaginatedAndCachedResults<IOrder>(
            req,
            res,
            this.order,
            this.CACHE_KEYS.RIDER_BY_ID(riderId),
            { 'delivery_info.riderId': riderId },
            { userId: 1, restaurantId: 1, status: 1, createdAt: 1 },
        );

        return {
            results: paginatedResults.results,
            pagination: {
                currentPage: paginatedResults.currentPage,
                totalPages: paginatedResults.totalPages,
                limit: paginatedResults.limit,
            },
        };
    }

    public async getRiderDeliveriesById(
        riderId: string,
        deliveryId: string,
    ): Promise<IOrder> {
        return withCachedData(
            this.CACHE_KEYS.RIDER_DELIVERY_BY_ID(riderId, deliveryId),
            async () => {
                const delivery = await this.order
                    .findOne({
                        _id: deliveryId,
                        'delivery_info.riderId': riderId,
                    })
                    .select('-__v')
                    .populate('delivery_info.riderId', 'name email')
                    .populate('restaurantId', 'name address')
                    .sort({ createdAt: -1 });

                if (!delivery) throw new ResourceNotFound('Delivery not found');

                return delivery;
            },
            CACHE_TTL.ONE_HOUR,
        );
    }
}
