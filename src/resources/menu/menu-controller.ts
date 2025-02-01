import { Router, Request, Response } from 'express';
import { Controller } from '@/types/index';
import { MenuService } from '@/resources/menu/menu-service';
import RestaurantModel from '@/resources/restaurant/model';
import { upload } from '@/config/index';
import validate from '@/resources/menu/menu-validation';
import {
    sendJsonResponse,
    asyncHandler,
    ResourceNotFound,
    authMiddleware,
    getCurrentUser,
    validateData,
} from '@/middlewares/index';

export default class MenuController implements Controller {
    public path = '/menu';
    public router = Router();
    private menuService = new MenuService();

    constructor() {
        this.initializeRoutes();
    }

    private initializeRoutes(): void {
        this.router.post(
            `${this.path}/:restaurantId`,
            authMiddleware(['restaurant_owner']),
            getCurrentUser(RestaurantModel),
            upload.single('image'),
            validateData(validate.addMenuItemSchema),
            this.addMenuItem,
        );
        this.router.get(`${this.path}/:restaurantId`, this.getMenuItems);
        this.router.patch(
            `${this.path}/:menuItemId`,
            authMiddleware(['restaurant_owner']),
            getCurrentUser(RestaurantModel),
            this.updateMenuItem,
        );
        this.router.delete(
            `${this.path}/:menuItemId`,
            authMiddleware(['restaurant_owner']),
            getCurrentUser(RestaurantModel),
            this.deleteMenuItem,
        );
    }

    private addMenuItem = asyncHandler(async (req: Request, res: Response) => {
        const { restaurantId } = req.params;
        const menuItemData = req.body;

        const userId = req.currentUser?._id;
        if (!userId) {
            throw new ResourceNotFound('Restaurant owner not found.');
        }
        console.log('userId:', userId); // Log the userId
        console.log('restaurantId:', restaurantId);
        const newMenuItem = await this.menuService.addMenuItem(
            restaurantId,
            menuItemData,
            req.file,
            userId,
        );

        sendJsonResponse(res, 201, 'Menu item added successfully', newMenuItem);
    });

    private getMenuItems = asyncHandler(async (req: Request, res: Response) => {
        const { restaurantId } = req.params;
        const menuItems = await this.menuService.getMenuItems(restaurantId);
        sendJsonResponse(
            res,
            200,
            'Menu items retrieved successfully',
            menuItems,
        );
    });

    private updateMenuItem = asyncHandler(
        async (req: Request, res: Response) => {
            const { menuItemId } = req.params;
            const updateData = req.body;

            const updatedMenuItem = await this.menuService.updateMenuItem(
                menuItemId,
                updateData,
            );

            sendJsonResponse(
                res,
                200,
                'Menu item updated successfully',
                updatedMenuItem,
            );
        },
    );

    private deleteMenuItem = asyncHandler(
        async (req: Request, res: Response) => {
            const { menuItemId } = req.params;
            await this.menuService.deleteMenuItem(menuItemId);
            sendJsonResponse(res, 200, 'Menu item deleted successfully');
        },
    );
}
