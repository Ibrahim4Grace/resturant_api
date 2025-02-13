"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const menu_service_1 = require("@/resources/menu/menu-service");
const model_1 = __importDefault(require("@/resources/restaurant/model"));
const index_1 = require("@/config/index");
const menu_validation_1 = __importDefault(require("@/resources/menu/menu-validation"));
const index_2 = require("@/middlewares/index");
class MenuController {
    constructor() {
        this.path = '/menu';
        this.router = (0, express_1.Router)();
        this.menuService = new menu_service_1.MenuService();
        this.addMenuItem = (0, index_2.asyncHandler)(async (req, res) => {
            const { restaurantId } = req.params;
            const menuItemData = req.body;
            const ownerId = req.ownerId;
            if (!ownerId) {
                throw new index_2.ResourceNotFound('Owner ID not found');
            }
            const userId = req.currentUser?._id;
            if (!userId) {
                throw new index_2.ResourceNotFound('Restaurant owner not found.');
            }
            const newMenuItem = await this.menuService.addMenuItem(restaurantId, menuItemData, ownerId, req.file);
            (0, index_2.sendJsonResponse)(res, 201, 'Menu item added successfully', newMenuItem);
        });
        this.fectchAllMenu = (0, index_2.asyncHandler)(async (req, res) => {
            const userId = req.currentUser?._id;
            if (!userId)
                throw new index_2.ResourceNotFound('Restaurant owner not found');
            const riders = await this.menuService.fetchAllMenu(req, res, userId);
            (0, index_2.sendJsonResponse)(res, 200, 'menus retrive succesful', riders);
        });
        this.getMenuById = (0, index_2.asyncHandler)(async (req, res) => {
            const { menuId } = req.params;
            const restaurantId = req.currentUser?._id;
            if (!restaurantId) {
                throw new index_2.ResourceNotFound('Restaurant owner not found');
            }
            const menuItems = await this.menuService.getMenuItems(menuId, restaurantId);
            (0, index_2.sendJsonResponse)(res, 200, 'Menu items retrieved successfully', menuItems);
        });
        this.updateMenuItem = (0, index_2.asyncHandler)(async (req, res) => {
            const { menuId } = req.params;
            const updateData = req.body;
            const restaurantId = req.currentUser?._id;
            if (!restaurantId) {
                throw new index_2.ResourceNotFound('Restaurant owner not found');
            }
            const updatedMenuItem = await this.menuService.updateMenuItem(menuId, restaurantId, updateData);
            (0, index_2.sendJsonResponse)(res, 200, 'Menu item updated successfully', updatedMenuItem);
        });
        this.deleteMenuItem = (0, index_2.asyncHandler)(async (req, res) => {
            const { menuId } = req.params;
            const restaurantId = req.currentUser?._id;
            if (!restaurantId) {
                throw new index_2.ResourceNotFound('Restaurant owner not found');
            }
            await this.menuService.deleteMenuItem(menuId, restaurantId);
            (0, index_2.sendJsonResponse)(res, 200, 'Menu item deleted successfully');
        });
        this.initializeRoutes();
    }
    initializeRoutes() {
        this.router.post(`${this.path}/:restaurantId`, (0, index_2.authMiddleware)(), (0, index_2.authorization)(model_1.default, ['restaurant_owner']), index_1.upload.single('image'), (0, index_2.validateData)(menu_validation_1.default.addMenuItemSchema), this.addMenuItem);
        this.router.get(`${this.path}`, (0, index_2.authMiddleware)(), (0, index_2.authorization)(model_1.default, ['restaurant_owner']), this.fectchAllMenu);
        this.router.get(`${this.path}/:menuId`, (0, index_2.authMiddleware)(), (0, index_2.authorization)(model_1.default, ['restaurant_owner']), this.getMenuById);
        this.router.patch(`${this.path}/:menuId`, (0, index_2.authMiddleware)(), (0, index_2.authorization)(model_1.default, ['restaurant_owner']), index_1.upload.single('image'), (0, index_2.validateData)(menu_validation_1.default.addMenuItemSchema), this.updateMenuItem);
        this.router.delete(`${this.path}/:menuId`, (0, index_2.authMiddleware)(), (0, index_2.authorization)(model_1.default, ['restaurant_owner']), this.deleteMenuItem);
    }
}
exports.default = MenuController;
//# sourceMappingURL=menu-controller.js.map