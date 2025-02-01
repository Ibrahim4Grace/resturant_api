import MenuModel from '@/resources/menu/menu-model';
import RestaurantModel from '@/resources/restaurant/model';
import { ResourceNotFound, Conflict, Unauthorized } from '@/middlewares/index';
import { IMenu, MenuItem, MenuItemData } from '@/resources/menu/menu-interface';
import { UploadedImage } from '@/types/index';
import { CloudinaryService } from '@/config/index';

export class MenuService {
    private menu = MenuModel;
    private restaurant = RestaurantModel;
    private cloudinaryService: CloudinaryService;
    constructor() {
        this.cloudinaryService = new CloudinaryService();
    }

    private sanitizeMenu(menuItem: IMenu): MenuItem {
        return {
            _id: menuItem._id.toString(),
            restaurantId: menuItem.restaurantId.toString(),
            name: menuItem.name,
            description: menuItem.description,
            price: menuItem.price,
            category: menuItem.category,
            image: menuItem.image,
            createdAt: menuItem.createdAt,
            updatedAt: menuItem.updatedAt,
        };
    }

    private async checkDuplicateMenuItem(
        restaurantId: string,
        menuItemData: MenuItemData,
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

    public async addMenuItem(
        restaurantId: string,
        menuItemData: MenuItemData,
        file?: Express.Multer.File,
        userId?: string,
    ): Promise<MenuItem> {
        console.log('Checking restaurant ownership:', {
            restaurantId,
            userId,
        });

        // // Find the restaurant by ID
        const restaurant = await this.restaurant.findById(restaurantId);
        if (!restaurant) {
            throw new ResourceNotFound('Restaurant not found');
        }
        console.log('restaurant', restaurant._id);

        // Check if the authenticated user is the owner of the restaurant
        if (restaurant.ownerId.toString() !== userId) {
            console.log('Restaurant not found or unauthorized:', {
                restaurantId,
                userId,
            });
            throw new Unauthorized(
                'You are not authorized to add menu items to this restaurant.',
            );
        }
        console.log('userId', userId);
        // console.log('restaurant.ownerId', restaurant.ownerId);

        await this.checkDuplicateMenuItem(restaurantId, menuItemData);

        let image: UploadedImage | undefined;
        if (file) {
            const uploadResult = await this.cloudinaryService.uploadImage(file);
            image = {
                imageId: uploadResult.imageId,
                imageUrl: uploadResult.imageUrl,
            };
        }
        const newMenuItem = await this.menu.create({
            restaurantId,
            image,
            ...menuItemData,
        });

        return this.sanitizeMenu(newMenuItem);
    }

    public async getMenuItems(restaurantId: string): Promise<MenuItem[]> {
        const menuItems = await this.menu.find({ restaurantId }).lean();
        if (!menuItems.length) {
            throw new ResourceNotFound(
                'No menu items found for this restaurant',
            );
        }
        return menuItems.map((item) => this.sanitizeMenu(item));

        // const paginatedResults = await getPaginatedAndCachedResults<IUser>(
        //             req,
        //             res,
        //             this.user,
        //             this.CACHE_KEYS.ALL_USERS,
        //             { name: 1, email: 1, addresses: 1, phone: 1, status: 1 },
        //         );

        //         return {
        //             results: paginatedResults.results,
        //             pagination: {
        //                 currentPage: paginatedResults.currentPage,
        //                 totalPages: paginatedResults.totalPages,
        //                 limit: paginatedResults.limit,
        //             },
        //         };
    }

    public async updateMenuItem(
        menuItemId: string,
        updateData: MenuItemData,
    ): Promise<any> {
        const updatedMenuItem = await this.menu
            .findByIdAndUpdate(menuItemId, updateData, { new: true })
            .lean();
        if (!updatedMenuItem) {
            throw new ResourceNotFound('Menu item not found');
        }
        return this.sanitizeMenu(updatedMenuItem);
    }

    public async deleteMenuItem(menuItemId: string): Promise<void> {
        const result = await this.menu.findByIdAndDelete(menuItemId);
        if (!result) {
            throw new ResourceNotFound('Menu item not found');
        }
    }
}
