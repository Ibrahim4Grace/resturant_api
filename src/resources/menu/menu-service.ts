import { Request, Response } from 'express';
import MenuModel from '../../resources/menu/menu-model';
import RestaurantModel from '../../resources/restaurant/model';
import { IMenu, MenuItem } from '../../resources/menu/menu-interface';
import { UploadedImage, IMenuPaginatedResponse } from '../../types/index';
import { CloudinaryService } from '../../config/index';
import { newMenuConfirmationEmail } from '../../resources/menu/menu-email-template';
import {
    ResourceNotFound,
    Conflict,
    Unauthorized,
} from '../../middlewares/index';
import {
    CACHE_TTL,
    getPaginatedAndCachedResults,
    withCachedData,
    EmailQueueService,
} from '../../utils/index';

export class MenuService {
    private menu = MenuModel;
    private restaurant = RestaurantModel;
    private readonly CACHE_KEYS = {
        ALL_MENUS: (userId: string) => `all_menus_${userId}`,
        MENU_BY_ID: (menuId: string, restaurantId: string) =>
            `menu_by_restaurant_${menuId}_${restaurantId}`,
    };
    private cloudinaryService: CloudinaryService;
    constructor() {
        this.cloudinaryService = new CloudinaryService();
    }

    private sanitizeMenu(menuItem: IMenu): MenuItem {
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

    private async checkDuplicateMenuItem(
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

    public async addMenuItem(
        restaurantId: string,
        menuItemData: MenuItem,
        ownerId: string,
        file: Express.Multer.File | undefined,
    ): Promise<MenuItem> {
        const restaurant = await this.restaurant.findById(restaurantId);
        if (!restaurant) {
            throw new ResourceNotFound('Restaurant not found');
        }

        const RestaurantOwner = await this.restaurant.findOne({
            _id: restaurantId,
            ownerId: ownerId,
        });

        if (!RestaurantOwner) {
            throw new Unauthorized(
                'You are not authorized to add menu items to this restaurant.',
            );
        }

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

        const emailOptions = newMenuConfirmationEmail(restaurant, menuItemData);
        await EmailQueueService.addEmailToQueue(emailOptions);

        return this.sanitizeMenu(newMenuItem);
    }

    public async fetchAllMenu(
        req: Request,
        res: Response,
        userId: string,
    ): Promise<IMenuPaginatedResponse> {
        const paginatedResults = await getPaginatedAndCachedResults<IMenu>(
            req,
            res,
            this.menu,
            this.CACHE_KEYS.ALL_MENUS(userId),
            { restaurantId: userId },
            { name: 1, description: 1, price: 1, category: 1, image: 1 },
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

    public async getMenuItems(
        menuId: string,
        restaurantId: string,
    ): Promise<MenuItem[]> {
        return withCachedData(
            this.CACHE_KEYS.MENU_BY_ID(menuId, restaurantId),

            async () => {
                const menuItems = await this.menu
                    .find({
                        _id: menuId,
                        restaurantId: restaurantId,
                    })
                    .lean();

                if (!menuItems.length) {
                    throw new ResourceNotFound(
                        'Menu not found or does not belong to this restaurant',
                    );
                }
                return menuItems.map(this.sanitizeMenu);
            },
            CACHE_TTL.ONE_HOUR,
        );
    }

    public async updateMenuItem(
        menuId: string,
        restaurantId: string,
        updateData: MenuItem,
    ): Promise<MenuItem> {
        const updatedMenuItem = await this.menu
            .findOneAndUpdate(
                {
                    _id: menuId,
                    restaurantId: restaurantId,
                },
                updateData,
                { new: true },
            )
            .lean();

        if (!updatedMenuItem) {
            throw new ResourceNotFound(
                'Menu item not found or does not belong to this restaurant',
            );
        }

        return this.sanitizeMenu(updatedMenuItem);
    }

    public async deleteMenuItem(
        menuId: string,
        restaurantId: string,
    ): Promise<void> {
        const result = await this.menu.findOneAndDelete({
            _id: menuId,
            restaurantId: restaurantId,
        });

        if (!result) {
            throw new ResourceNotFound(
                'Menu item not found or does not belong to this restaurant',
            );
        }
    }
}
