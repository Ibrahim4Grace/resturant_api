import { IOrder } from '../order/order-interface';
import { Model } from 'mongoose';
import { IUser } from '../user/user-interface';
import { IMenu } from '../menu/menu-interface';
import { ResourceNotFound, Unauthorized } from '../../middlewares';
import { SettingsService } from '../settings/setting-service';
import { ISetting } from '../settings/setting-interface';
import { withCachedData, CACHE_TTL, CACHE_KEYS } from '../../utils';

const settingsService = new SettingsService();

export function orderData(order: IOrder): Partial<IOrder> {
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
        payment_method: order.payment_method,
        delivery_fee: order.delivery_fee,
        delivery_info: order.delivery_info,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
    };
}

export async function validateUser(
    userId: string,
    userModel: Model<IUser>,
): Promise<IUser> {
    const user = await userModel.findById(userId);
    if (!user) throw new ResourceNotFound('User not found');
    return user;
}

export async function checkOrderOwnership(
    orderId: string,
    restaurantId: string,
    orderModel: Model<IOrder>,
): Promise<void> {
    const order = await orderModel
        .findOne({
            _id: orderId,
            restaurantId: restaurantId,
        })
        .lean();

    if (!order) {
        throw new Unauthorized(
            'Order not found or does not belong to this restaurant.',
        );
    }
}

// Retry logic for database queries
const retry = async <T>(
    fn: () => Promise<T>,
    retries = 3,
    delay = 1000,
): Promise<T> => {
    for (let i = 0; i < retries; i++) {
        try {
            return await fn();
        } catch (error) {
            if (i === retries - 1) throw error;
            await new Promise((resolve) => setTimeout(resolve, delay));
        }
    }
    throw new Error('Retry limit reached');
};

export async function calculateOrderAmounts(
    items: { menuId: string; quantity: number }[],
    menuModel: Model<IMenu>,
) {
    // Batch fetch all menu items in a single query
    const menuIds = items.map((item) => item.menuId);
    const menuItems = await retry(() =>
        menuModel
            .find({ _id: { $in: menuIds } })
            .lean()
            .exec(),
    );

    const itemsWithPrices = items.map((item) => {
        const menuItem = menuItems.find(
            (m) => m._id.toString() === item.menuId,
        );
        if (!menuItem) {
            throw new ResourceNotFound(
                `Menu item with ID ${item.menuId} not found`,
            );
        }
        return {
            ...item,
            price: menuItem.price,
            name: menuItem.name,
        };
    });

    const subtotal = itemsWithPrices.reduce(
        (acc, item) => acc + item.quantity * item.price,
        0,
    );

    // Fetch settings from cache or database
    const settings = await withCachedData<Partial<ISetting>>(
        CACHE_KEYS.SETTINGS,
        () => retry(() => settingsService.getSettings()),
        CACHE_TTL.ONE_HOUR,
    );

    const taxRate = settings.tax_rate;
    const delivery_fee = settings.delivery_fee;
    const tax = subtotal * taxRate;
    const total_price = subtotal + tax + delivery_fee;

    return {
        itemsWithPrices,
        roundedSubtotal: Math.round(subtotal * 100) / 100,
        roundedTax: Math.round(tax * 100) / 100,
        roundedTotalPrice: Math.round(total_price * 100) / 100,
        delivery_fee,
    };
}
