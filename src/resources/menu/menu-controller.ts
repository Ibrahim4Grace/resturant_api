import { Router, Request, Response } from 'express';
import { Controller } from '../../types/index';
import { MenuService } from '../menu/menu-service';
import RestaurantModel from '../restaurant/restaurant-model';
import { upload } from '../../config/index';
import validate from '../menu/menu-validation';
import {
    sendJsonResponse,
    asyncHandler,
    ResourceNotFound,
    authMiddleware,
    authorization,
    validateData,
} from '../../middlewares/index';

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
            authMiddleware(),
            authorization(RestaurantModel, ['restaurant_owner']),
            upload.single('image'),
            validateData(validate.addMenuItemSchema),
            this.addMenuItem,
        );
        this.router.get(
            `${this.path}`,
            authMiddleware(),
            authorization(RestaurantModel, ['restaurant_owner']),
            this.fectchAllMenu,
        );
        this.router.get(
            `${this.path}/:menuId`,
            authMiddleware(),
            authorization(RestaurantModel, ['restaurant_owner']),
            this.getMenuById,
        );
        this.router.patch(
            `${this.path}/:menuId`,
            authMiddleware(),
            authorization(RestaurantModel, ['restaurant_owner']),
            upload.single('image'),
            validateData(validate.addMenuItemSchema),
            this.updateMenuItem,
        );
        this.router.delete(
            `${this.path}/:menuId`,
            authMiddleware(),
            authorization(RestaurantModel, ['restaurant_owner']),
            this.deleteMenuItem,
        );
    }

    private addMenuItem = asyncHandler(async (req: Request, res: Response) => {
        const { restaurantId } = req.params;
        const menuItemData = req.body;

        const ownerId = req.ownerId;
        if (!ownerId) {
            throw new ResourceNotFound('Owner ID not found');
        }

        const userId = req.currentUser._id;
        if (!userId) {
            throw new ResourceNotFound('Restaurant owner not found.');
        }
        const newMenuItem = await this.menuService.addMenuItem(
            restaurantId,
            menuItemData,
            ownerId,
            req.file,
        );

        sendJsonResponse(res, 201, 'Menu item added successfully', newMenuItem);
    });

    private fectchAllMenu = asyncHandler(
        async (req: Request, res: Response): Promise<void> => {
            const menuId = req.currentUser._id;
            if (!menuId)
                throw new ResourceNotFound('Restaurant owner not found');
            const riders = await this.menuService.fetchAllMenu(
                req,
                res,
                menuId,
            );

            sendJsonResponse(res, 200, 'menus retrive succesful', riders);
        },
    );

    private getMenuById = asyncHandler(async (req: Request, res: Response) => {
        const { menuId } = req.params;
        const restaurantId = req.currentUser._id;
        if (!restaurantId) {
            throw new ResourceNotFound('Restaurant owner not found');
        }

        const menuItems = await this.menuService.getMenuItems(
            menuId,
            restaurantId,
        );
        sendJsonResponse(
            res,
            200,
            'Menu items retrieved successfully',
            menuItems,
        );
    });

    private updateMenuItem = asyncHandler(
        async (req: Request, res: Response) => {
            const { menuId } = req.params;
            const updateData = req.body;
            const restaurantId = req.currentUser._id;
            if (!restaurantId) {
                throw new ResourceNotFound('Restaurant owner not found');
            }

            const updatedMenuItem = await this.menuService.updateMenuItem(
                menuId,
                restaurantId,
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
            const { menuId } = req.params;
            const restaurantId = req.currentUser._id;
            if (!restaurantId) {
                throw new ResourceNotFound('Restaurant owner not found');
            }
            await this.menuService.deleteMenuItem(menuId, restaurantId);
            sendJsonResponse(res, 200, 'Menu item deleted successfully');
        },
    );
}
