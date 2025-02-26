import { IMenu, MenuItem } from '../menu/menu-interface';
import { Conflict } from '../../middlewares/index';

export function menuData(menuItem: IMenu): MenuItem {
    return {
        _id: menuItem._id.toString(),
        restaurantId: menuItem.restaurantId.toString(),
        name: menuItem.name,
        quantity: menuItem.quantity,
        description: menuItem.description,
        price: menuItem.price,
        category: menuItem.category,
        image: menuItem.image,
        createdAt: menuItem.createdAt,
        updatedAt: menuItem.updatedAt,
    };
}

export async function checkDuplicateMenuItem(
    restaurantId: string,
    menuItemData: MenuItem,
): Promise<void> {
    const existingMenuItem = await this.menu.findOne({
        restaurantId,
        name: menuItemData.name,
        description: menuItemData.description,
        price: menuItemData.price,
        category: menuItemData.category,
    });

    if (existingMenuItem) {
        throw new Conflict(
            'Duplicate menu item: A menu item with this name already exists for this restaurant.',
        );
    }
}
