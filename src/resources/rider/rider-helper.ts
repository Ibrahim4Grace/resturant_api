import { Conflict, ResourceNotFound } from '../../middlewares/index';
import { IRider } from '../rider/rider-interface';

export async function checkDuplicate(
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
export async function findRiderById(riderId: string): Promise<IRider> {
    const rider = await this.rider.findById(riderId);
    if (!rider) {
        throw new ResourceNotFound('Rider not found');
    }
    return rider;
}
export async function findRiderByEmail(email: string) {
    return this.rider.findOne({
        email: email.toLowerCase().trim(),
    });
}
export async function findRiderByVerificationToken(verificationToken: string) {
    return this.rider.findOne({
        'emailVerificationOTP.verificationToken': verificationToken,
        'emailVerificationOTP.expiresAt': { $gt: new Date() },
    });
}

export function riderData(rider: IRider): Partial<IRider> {
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

export async function checkOrderAssignment(
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
