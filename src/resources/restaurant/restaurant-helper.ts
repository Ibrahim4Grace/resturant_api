import { Conflict } from '../../middlewares/index';
import {
    IRestaurant,
    Address,
    ISanitizedRestaurant,
} from '../restaurant/restaurant-interface';

export async function checkDuplicate(
    field: 'email' | 'phone',
    value: string,
): Promise<void> {
    const existingRestaurant = await this.restaurant.findOne({
        [field]: value,
    });
    if (existingRestaurant) {
        throw new Conflict(
            `${field === 'email' ? 'Email' : 'Phone Number'} already registered!`,
        );
    }
}

export async function checkDuplicateAddress(address: Address): Promise<void> {
    if (!address) return;

    const duplicateAddress = await this.restaurant.findOne({
        'address.street': address.street,
        'address.city': address.city,
        'address.state': address.state,
    });

    if (duplicateAddress) {
        throw new Conflict('Duplicate address: This address already exists.');
    }
}

export async function findRestaurantByVerificationToken(
    verificationToken: string,
) {
    return this.restaurant.findOne({
        'emailVerificationOTP.verificationToken': verificationToken,
        'emailVerificationOTP.expiresAt': { $gt: new Date() },
    });
}

export function restaurantData(restaurant: IRestaurant): ISanitizedRestaurant {
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
