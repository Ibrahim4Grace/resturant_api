import { IOrder } from '../order/order-interface';
import { Model } from 'mongoose';
import { IUser } from '../user/user-interface';
import { IMenu } from '../menu/menu-interface';
import { ResourceNotFound, Unauthorized } from '../../middlewares/index';
import { SettingsService } from '../settings/setting-service';
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
    if (!user) {
        throw new ResourceNotFound('User not found');
    }
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

export async function calculateOrderAmounts(
    items: { menuId: string; quantity: number }[],
    menuModel: Model<IMenu>,
) {
    const itemsWithPrices = await Promise.all(
        items.map(async (item) => {
            const menuItem = await menuModel.findById(item.menuId);
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
        }),
    );

    const subtotal = itemsWithPrices.reduce(
        (acc, item) => acc + item.quantity * item.price,
        0,
    );

    const settings = await settingsService.getSettings();
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
