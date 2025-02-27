import { Request, Response } from 'express';
import MenuModel from '../menu/menu-model';
import RestaurantModel from '../restaurant/restaurant-model';
import { IMenu, MenuItem } from '../menu/menu-interface';
import { UploadedImage, IMenuPaginatedResponse } from '../../types/index';
import { CloudinaryService } from '../../config/index';
import { newMenuConfirmationEmail } from '../menu/menu-email-template';
import { menuData, checkDuplicateMenuItem } from '../menu/menu-helper';
import { ResourceNotFound, Unauthorized } from '../../middlewares/index';
import {
    CACHE_TTL,
    getPaginatedAndCachedResults,
    withCachedData,
    EmailQueueService,
    deleteCacheData,
    CACHE_KEYS,
} from '../../utils/index';

export class MenuService {
    private menu = MenuModel;
    private restaurant = RestaurantModel;
    private menuData = menuData;
    private checkDuplicateMenuItem = checkDuplicateMenuItem;

    private cloudinaryService: CloudinaryService;
    constructor() {
        this.cloudinaryService = new CloudinaryService();
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

        return this.menuData(newMenuItem);
    }

    public async fetchAllMenu(
        req: Request,
        res: Response,
        restaurantId: string,
    ): Promise<IMenuPaginatedResponse> {
        const paginatedResults = await getPaginatedAndCachedResults<IMenu>(
            req,
            res,
            this.menu,
            CACHE_KEYS.ALL_MENUS(restaurantId),
            { restaurantId: restaurantId },
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
            CACHE_KEYS.MENU_BY_ID(menuId, restaurantId),
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
                return menuItems.map(this.menuData);
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
        await Promise.all([
            deleteCacheData(CACHE_KEYS.ALL_MENUS(menuId)),
            deleteCacheData(CACHE_KEYS.MENU_BY_ID(menuId, restaurantId)),
        ]);
        return this.menuData(updatedMenuItem);
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

        await Promise.all([
            deleteCacheData(CACHE_KEYS.ALL_MENUS(menuId)),
            deleteCacheData(CACHE_KEYS.MENU_BY_ID(menuId, restaurantId)),
        ]);
    }
}
