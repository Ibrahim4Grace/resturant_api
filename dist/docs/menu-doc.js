"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.allMenuDocs = exports.menuDocs = void 0;
exports.menuDocs = {
    paths: {
        '/menu/{restaurantId}': {
            post: {
                summary: 'Add a new menu item',
                tags: ['Menu'],
                security: [{ BearerAuth: [] }],
                parameters: [
                    {
                        name: 'restaurantId',
                        in: 'path',
                        required: true,
                        schema: {
                            type: 'string',
                            example: '65a1b2c3d4e5f6a7b8c9d0e1',
                        },
                    },
                ],
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    name: {
                                        type: 'string',
                                        example: 'Margherita Pizza',
                                    },
                                    description: {
                                        type: 'string',
                                        example: 'Classic pizza with tomato sauce, mozzarella, and basil',
                                    },
                                    price: { type: 'number', example: 10.99 },
                                    category: {
                                        type: 'string',
                                        example: 'Pizza',
                                    },
                                    image: {
                                        type: 'object',
                                        properties: {
                                            imageId: {
                                                type: 'string',
                                                example: 'pizza_margherita',
                                            },
                                            imageUrl: {
                                                type: 'string',
                                                example: 'https://example.com/pizza_margherita.jpg',
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
                responses: {
                    201: {
                        description: 'Menu item added successfully',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        status: {
                                            type: 'number',
                                            example: 201,
                                        },
                                        message: {
                                            type: 'string',
                                            example: 'Menu item added successfully',
                                        },
                                        data: {
                                            type: 'object',
                                            properties: {
                                                _id: {
                                                    type: 'string',
                                                    example: '65a1b2c3d4e5f6a7b8c9d0e2',
                                                },
                                                name: {
                                                    type: 'string',
                                                    example: 'Margherita Pizza',
                                                },
                                                price: {
                                                    type: 'number',
                                                    example: 10.99,
                                                },
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },
                    400: { description: 'Bad request (e.g., invalid data)' },
                    404: { description: 'Restaurant not found' },
                    500: { description: 'Server error' },
                },
            },
            get: {
                summary: 'Get  menu by  restaurant Id',
                tags: ['Menu'],
                parameters: [
                    {
                        name: 'restaurantId',
                        in: 'path',
                        required: true,
                        schema: {
                            type: 'string',
                            example: '65a1b2c3d4e5f6a7b8c9d0e1',
                        },
                    },
                ],
                responses: {
                    200: {
                        description: 'Menu items retrieved successfully',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        status: {
                                            type: 'number',
                                            example: 200,
                                        },
                                        message: {
                                            type: 'string',
                                            example: 'Menu items retrieved successfully',
                                        },
                                        data: {
                                            type: 'array',
                                            items: {
                                                type: 'object',
                                                properties: {
                                                    _id: {
                                                        type: 'string',
                                                        example: '65a1b2c3d4e5f6a7b8c9d0e2',
                                                    },
                                                    name: {
                                                        type: 'string',
                                                        example: 'Margherita Pizza',
                                                    },
                                                    price: {
                                                        type: 'number',
                                                        example: 10.99,
                                                    },
                                                },
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },
                    404: {
                        description: 'No menu items found for this restaurant',
                    },
                    500: { description: 'Server error' },
                },
            },
        },
        '/menu': {
            get: {
                summary: 'Get all menu items for a restaurant',
                tags: ['Menu'],
                security: [{ BearerAuth: [] }],
                parameters: [
                    {
                        name: 'restaurantId',
                        in: 'path',
                        required: true,
                        schema: {
                            type: 'string',
                            example: '65a1b2c3d4e5f6a7b8c9d0e1',
                        },
                    },
                ],
                responses: {
                    200: {
                        description: 'Menu items retrieved successfully',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        status: {
                                            type: 'number',
                                            example: 200,
                                        },
                                        message: {
                                            type: 'string',
                                            example: 'Menus retrieved successfully',
                                        },
                                        data: {
                                            type: 'object',
                                            properties: {
                                                results: {
                                                    type: 'array',
                                                    items: {
                                                        type: 'object',
                                                        properties: {
                                                            _id: {
                                                                type: 'string',
                                                                example: '65a1b2c3d4e5f6a7b8c9d0e2',
                                                            },
                                                            name: {
                                                                type: 'string',
                                                                example: 'Margherita Pizza',
                                                            },
                                                            description: {
                                                                type: 'string',
                                                                example: 'Classic pizza with tomato sauce, mozzarella, and basil',
                                                            },
                                                            price: {
                                                                type: 'number',
                                                                example: 10.99,
                                                            },
                                                            category: {
                                                                type: 'string',
                                                                example: 'Pizza',
                                                            },
                                                            image: {
                                                                type: 'object',
                                                                properties: {
                                                                    imageId: {
                                                                        type: 'string',
                                                                        example: 'pizza_margherita',
                                                                    },
                                                                    imageUrl: {
                                                                        type: 'string',
                                                                        example: 'https://example.com/pizza_margherita.jpg',
                                                                    },
                                                                },
                                                            },
                                                        },
                                                    },
                                                },
                                                pagination: {
                                                    type: 'object',
                                                    properties: {
                                                        currentPage: {
                                                            type: 'number',
                                                            example: 1,
                                                        },
                                                        totalPages: {
                                                            type: 'number',
                                                            example: 10,
                                                        },
                                                        limit: {
                                                            type: 'number',
                                                            example: 20,
                                                        },
                                                    },
                                                },
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },
                    404: {
                        description: 'No menu items found for this restaurant',
                    },
                    500: { description: 'Server error' },
                },
            },
        },
        '/menu/{menuId}': {
            patch: {
                summary: 'Update a menu item',
                tags: ['Menu'],
                security: [{ BearerAuth: [] }],
                parameters: [
                    {
                        name: 'menuId',
                        in: 'path',
                        required: true,
                        schema: {
                            type: 'string',
                            example: '65a1b2c3d4e5f6a7b8c9d0e2',
                        },
                    },
                ],
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    name: {
                                        type: 'string',
                                        example: 'Margherita Pizza',
                                    },
                                    description: {
                                        type: 'string',
                                        example: 'Classic pizza with tomato sauce, mozzarella, and basil',
                                    },
                                    price: { type: 'number', example: 12.99 },
                                    category: {
                                        type: 'string',
                                        example: 'Pizza',
                                    },
                                    image: {
                                        type: 'object',
                                        properties: {
                                            imageId: {
                                                type: 'string',
                                                example: 'pizza_margherita',
                                            },
                                            imageUrl: {
                                                type: 'string',
                                                example: 'https://example.com/pizza_margherita.jpg',
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
                responses: {
                    200: {
                        description: 'Menu item updated successfully',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        status: {
                                            type: 'number',
                                            example: 200,
                                        },
                                        message: {
                                            type: 'string',
                                            example: 'Menu item updated successfully',
                                        },
                                        data: {
                                            type: 'object',
                                            properties: {
                                                _id: {
                                                    type: 'string',
                                                    example: '65a1b2c3d4e5f6a7b8c9d0e2',
                                                },
                                                name: {
                                                    type: 'string',
                                                    example: 'Margherita Pizza',
                                                },
                                                price: {
                                                    type: 'number',
                                                    example: 12.99,
                                                },
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },
                    400: { description: 'Bad request (e.g., invalid data)' },
                    404: { description: 'Menu item not found' },
                    500: { description: 'Server error' },
                },
            },
            delete: {
                summary: 'Delete a menu item',
                tags: ['Menu'],
                security: [{ BearerAuth: [] }],
                parameters: [
                    {
                        name: 'menuId',
                        in: 'path',
                        required: true,
                        schema: {
                            type: 'string',
                            example: '65a1b2c3d4e5f6a7b8c9d0e2',
                        },
                    },
                ],
                responses: {
                    200: {
                        description: 'Menu item deleted successfully',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        status: {
                                            type: 'number',
                                            example: 200,
                                        },
                                        message: {
                                            type: 'string',
                                            example: 'Menu item deleted successfully',
                                        },
                                    },
                                },
                            },
                        },
                    },
                    404: { description: 'Menu item not found' },
                    500: { description: 'Server error' },
                },
            },
        },
    },
};
exports.allMenuDocs = {
    paths: {
        ...exports.menuDocs.paths,
    },
};
//# sourceMappingURL=menu-doc.js.map