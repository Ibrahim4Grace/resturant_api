import { IUser } from '../user/user-interface';
import { Conflict, ResourceNotFound } from '../../middlewares/index';

export async function checkDuplicate(
    field: 'email' | 'phone',
    value: string,
): Promise<void> {
    const existingUser = await this.user.findOne({ [field]: value });
    if (existingUser) {
        throw new Conflict(
            `${field === 'email' ? 'Email' : 'Phone Number'} already registered!`,
        );
    }
}

export async function findUserByEmail(email: string) {
    return this.user.findOne({
        email: email.toLowerCase().trim(),
    });
}

export async function findUserById(userId: string): Promise<IUser> {
    const user = await this.user.findById(userId).lean();
    if (!user) {
        throw new ResourceNotFound('User not found');
    }
    return user;
}

export async function findUserByVerificationToken(verificationToken: string) {
    return this.user.findOne({
        'emailVerificationOTP.verificationToken': verificationToken,
        'emailVerificationOTP.expiresAt': { $gt: new Date() },
    });
}

export function userData(user: IUser): Partial<IUser> {
    return {
        _id: user._id,
        name: user.name,
        email: user.email,
        addresses: user.addresses,
        phone: user.phone,
        isEmailVerified: user.isEmailVerified,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
    };
}
