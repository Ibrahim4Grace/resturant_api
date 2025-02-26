import { IAdmin } from '../admin/admin-interface';
import { Conflict, ResourceNotFound } from '../../middlewares/index';

export async function checkDuplicate(
    field: 'email' | 'phone',
    value: string,
): Promise<void> {
    const existingUser = await this.admin.findOne({ [field]: value });
    if (existingUser) {
        throw new Conflict(
            `${field === 'email' ? 'Email' : 'Phone Number'} already registered!`,
        );
    }
}

export async function findAdminByEmail(email: string) {
    return this.admin.findOne({
        email: email.toLowerCase().trim(),
    });
}

export async function findAdminById(adminId: string): Promise<IAdmin> {
    const admin = await this.admin.findById(adminId).lean();
    if (!admin) {
        throw new ResourceNotFound('Admin not found');
    }
    return admin;
}

export async function findAdminByVerificationToken(verificationToken: string) {
    return this.admin.findOne({
        'emailVerificationOTP.verificationToken': verificationToken,
        'emailVerificationOTP.expiresAt': { $gt: new Date() },
    });
}

export function adminData(admin: IAdmin): Partial<IAdmin> {
    return {
        _id: admin._id,
        name: admin.name,
        email: admin.email,
        phone: admin.phone,
        address: admin.address,
        role: admin.role,
        createdAt: admin.createdAt,
        updatedAt: admin.updatedAt,
    };
}
