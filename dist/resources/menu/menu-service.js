"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MenuService = void 0;
const menu_model_1 = __importDefault(require("@/resources/menu/menu-model"));
const model_1 = __importDefault(require("@/resources/restaurant/model"));
const index_1 = require("@/middlewares/index");
const index_2 = require("@/config/index");
const menu_email_template_1 = require("@/resources/menu/menu-email-template");
const index_3 = require("@/utils/index");
class MenuService {
    constructor() {
        this.menu = menu_model_1.default;
        this.restaurant = model_1.default;
        this.CACHE_KEYS = {
            ALL_MENUS: (userId) => `all_menus_${userId}`,
            MENU_BY_ID: (menuId, restaurantId) => `menu_by_restaurant_${menuId}_${restaurantId}`,
        };
        this.cloudinaryService = new index_2.CloudinaryService();
    }
    sanitizeMenu(menuItem) {
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
    async checkDuplicateMenuItem(restaurantId, menuItemData) {
        const existingMenuItem = await this.menu.findOne({
            restaurantId,
            name: menuItemData.name,
            description: menuItemData.description,
            price: menuItemData.price,
            category: menuItemData.category,
        });
        if (existingMenuItem) {
            throw new index_1.Conflict('Duplicate menu item: A menu item with this name already exists for this restaurant.');
        }
    }
    async addMenuItem(restaurantId, menuItemData, ownerId, file) {
        const restaurant = await this.restaurant.findById(restaurantId);
        if (!restaurant) {
            throw new index_1.ResourceNotFound('Restaurant not found');
        }
        const RestaurantOwner = await this.restaurant.findOne({
            _id: restaurantId,
            ownerId: ownerId,
        });
        if (!RestaurantOwner) {
            throw new index_1.Unauthorized('You are not authorized to add menu items to this restaurant.');
        }
        await this.checkDuplicateMenuItem(restaurantId, menuItemData);
        let image;
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
        const emailOptions = (0, menu_email_template_1.newMenuConfirmationEmail)(restaurant, menuItemData);
        await index_3.EmailQueueService.addEmailToQueue(emailOptions);
        return this.sanitizeMenu(newMenuItem);
    }
    async fetchAllMenu(req, res, userId) {
        const paginatedResults = await (0, index_3.getPaginatedAndCachedResults)(req, res, this.menu, this.CACHE_KEYS.ALL_MENUS(userId), { restaurantId: userId }, { name: 1, description: 1, price: 1, category: 1, image: 1 });
        return {
            results: paginatedResults.results,
            pagination: {
                currentPage: paginatedResults.currentPage,
                totalPages: paginatedResults.totalPages,
                limit: paginatedResults.limit,
            },
        };
    }
    async getMenuItems(menuId, restaurantId) {
        return (0, index_3.withCachedData)(this.CACHE_KEYS.MENU_BY_ID(menuId, restaurantId), async () => {
            const menuItems = await this.menu
                .find({
                _id: menuId,
                restaurantId: restaurantId,
            })
                .lean();
            if (!menuItems.length) {
                throw new index_1.ResourceNotFound('Menu not found or does not belong to this restaurant');
            }
            return menuItems.map(this.sanitizeMenu);
        }, index_3.CACHE_TTL.ONE_HOUR);
    }
    async updateMenuItem(menuId, restaurantId, updateData) {
        const updatedMenuItem = await this.menu
            .findOneAndUpdate({
            _id: menuId,
            restaurantId: restaurantId,
        }, updateData, { new: true })
            .lean();
        if (!updatedMenuItem) {
            throw new index_1.ResourceNotFound('Menu item not found or does not belong to this restaurant');
        }
        return this.sanitizeMenu(updatedMenuItem);
    }
    async deleteMenuItem(menuId, restaurantId) {
        const result = await this.menu.findOneAndDelete({
            _id: menuId,
            restaurantId: restaurantId,
        });
        if (!result) {
            throw new index_1.ResourceNotFound('Menu item not found or does not belong to this restaurant');
        }
    }
}
exports.MenuService = MenuService;
//# sourceMappingURL=menu-service.js.map