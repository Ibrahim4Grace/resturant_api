export const orderDocs = {
    paths: {
        '/api/v1/orders': {
            post: {
                summary: 'Place a new order',
                tags: ['Orders'],
                security: [{ BearerAuth: [] }],
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    items: {
                                        type: 'array',
                                        items: {
                                            type: 'object',
                                            properties: {
                                                menuId: {
                                                    type: 'string',
                                                    example:
                                                        '65a1b2c3d4e5f6a7b8c9d0e1',
                                                },
                                                quantity: {
                                                    type: 'number',
                                                    example: 2,
                                                },
                                                price: {
                                                    type: 'number',
                                                    example: 10,
                                                },
                                            },
                                        },
                                    },
                                    restaurantId: {
                                        type: 'string',
                                        example: '65a1b2c3d4e5f6a7b8c9d0e2',
                                    },
                                },
                            },
                        },
                    },
                },
                responses: {
                    201: {
                        description: 'Order placed successfully',
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
                                            example:
                                                'Order placed successfully',
                                        },
                                        data: {
                                            type: 'object',
                                            properties: {
                                                _id: {
                                                    type: 'string',
                                                    example:
                                                        '65a1b2c3d4e5f6a7b8c9d0e3',
                                                },
                                                status: {
                                                    type: 'string',
                                                    example: 'pending',
                                                },
                                                total: {
                                                    type: 'number',
                                                    example: 25.5,
                                                },
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },
                    400: { description: 'Bad request (e.g., invalid data)' },
                    404: { description: 'User not found' },
                    500: { description: 'Server error' },
                },
            },
            get: {
                summary: 'Get all orders for the current user',
                tags: ['Orders'],
                security: [{ BearerAuth: [] }],
                responses: {
                    200: {
                        description: 'Orders retrieved successfully',
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
                                            example:
                                                'Orders retrieved successfully',
                                        },
                                        data: {
                                            type: 'array',
                                            items: {
                                                type: 'object',
                                                properties: {
                                                    _id: {
                                                        type: 'string',
                                                        example:
                                                            '65a1b2c3d4e5f6a7b8c9d0e3',
                                                    },
                                                    status: {
                                                        type: 'string',
                                                        example: 'pending',
                                                    },
                                                    total: {
                                                        type: 'number',
                                                        example: 25.5,
                                                    },
                                                },
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },
                    404: { description: 'User not found' },
                    500: { description: 'Server error' },
                },
            },
        },
        paths: {
            '/api/v1/orders/{id}/assign-rider': {
                patch: {
                    summary: 'Assign a rider to an order',
                    tags: ['Orders'],
                    security: [{ BearerAuth: [] }],
                    parameters: [
                        {
                            name: 'id',
                            in: 'path',
                            required: true,
                            description: 'Order ID',
                            schema: {
                                type: 'string',
                                example: '67a9d4c7dddd485a0a9e6684',
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
                                        rider_name: {
                                            type: 'string',
                                            example: 'John Rider',
                                        },
                                    },
                                },
                            },
                        },
                    },
                    responses: {
                        200: {
                            description: 'Rider assigned successfully',
                            content: {
                                'application/json': {
                                    schema: {
                                        type: 'object',
                                        properties: {
                                            status: {
                                                type: 'string',
                                                example: 'success',
                                            },
                                            message: {
                                                type: 'string',
                                                example:
                                                    'Rider assigned successfully',
                                            },
                                            data: { type: 'object' },
                                        },
                                    },
                                },
                            },
                        },
                        404: { description: 'Order or Rider not found' },
                        500: { description: 'Server error' },
                    },
                },
            },
            '/api/v1/orders/{id}/status': {
                patch: {
                    summary: 'Update order status',
                    tags: ['Orders'],
                    security: [{ BearerAuth: [] }],
                    parameters: [
                        {
                            name: 'id',
                            in: 'path',
                            required: true,
                            description: 'Order ID',
                            schema: {
                                type: 'string',
                                example: '67a9d4c7dddd485a0a9e6684',
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
                                        status: {
                                            type: 'string',
                                            example: 'delivered',
                                        },
                                    },
                                },
                            },
                        },
                    },
                    responses: {
                        200: {
                            description: 'Order status updated successfully',
                            content: {
                                'application/json': {
                                    schema: {
                                        type: 'object',
                                        properties: {
                                            status: {
                                                type: 'string',
                                                example: 'success',
                                            },
                                            message: {
                                                type: 'string',
                                                example:
                                                    'Order status updated successfully',
                                            },
                                            data: { type: 'object' },
                                        },
                                    },
                                },
                            },
                        },
                        404: { description: 'Order not found' },
                        500: { description: 'Server error' },
                    },
                },
            },
        },
        '/api/v1/orders/{id}': {
            get: {
                summary: 'Get an order by ID',
                tags: ['Orders'],
                security: [{ BearerAuth: [] }],
                parameters: [
                    {
                        name: 'id',
                        in: 'path',
                        required: true,
                        schema: {
                            type: 'string',
                            example: '65a1b2c3d4e5f6a7b8c9d0e3',
                        },
                    },
                ],
                responses: {
                    200: {
                        description: 'Order retrieved successfully',
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
                                            example:
                                                'Order retrieved successfully',
                                        },
                                        data: {
                                            type: 'object',
                                            properties: {
                                                _id: {
                                                    type: 'string',
                                                    example:
                                                        '65a1b2c3d4e5f6a7b8c9d0e3',
                                                },
                                                status: {
                                                    type: 'string',
                                                    example: 'pending',
                                                },
                                                total: {
                                                    type: 'number',
                                                    example: 25.5,
                                                },
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },
                    404: { description: 'Order not found' },
                    500: { description: 'Server error' },
                },
            },
            patch: {
                summary: 'Update order status',
                tags: ['Orders'],
                parameters: [
                    {
                        name: 'id',
                        in: 'path',
                        required: true,
                        schema: {
                            type: 'string',
                            example: '65a1b2c3d4e5f6a7b8c9d0e3',
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
                                    status: {
                                        type: 'string',
                                        enum: [
                                            'pending',
                                            'processing',
                                            'ready_for_pickup',
                                            'shipped',
                                            'delivered',
                                            'cancelled',
                                        ],
                                        example: 'processing',
                                    },
                                },
                            },
                        },
                    },
                },
                responses: {
                    200: {
                        description: 'Order status updated successfully',
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
                                            example:
                                                'Order status updated successfully',
                                        },
                                        data: {
                                            type: 'object',
                                            properties: {
                                                _id: {
                                                    type: 'string',
                                                    example:
                                                        '65a1b2c3d4e5f6a7b8c9d0e3',
                                                },
                                                status: {
                                                    type: 'string',
                                                    example: 'processing',
                                                },
                                                total: {
                                                    type: 'number',
                                                    example: 25.5,
                                                },
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },
                    400: { description: 'Bad request (e.g., invalid status)' },
                    404: { description: 'Order not found' },
                    500: { description: 'Server error' },
                },
            },
            delete: {
                summary: 'Cancel an order',
                tags: ['Orders'],
                security: [{ BearerAuth: [] }],
                parameters: [
                    {
                        name: 'id',
                        in: 'path',
                        required: true,
                        schema: {
                            type: 'string',
                            example: '65a1b2c3d4e5f6a7b8c9d0e3',
                        },
                    },
                ],
                responses: {
                    200: {
                        description: 'Order cancelled successfully',
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
                                            example:
                                                'Order cancelled successfully',
                                        },
                                        data: {
                                            type: 'object',
                                            properties: {
                                                _id: {
                                                    type: 'string',
                                                    example:
                                                        '65a1b2c3d4e5f6a7b8c9d0e3',
                                                },
                                                status: {
                                                    type: 'string',
                                                    example: 'cancelled',
                                                },
                                                total: {
                                                    type: 'number',
                                                    example: 25.5,
                                                },
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },
                    400: { description: 'Order cannot be cancelled' },
                    404: { description: 'Order not found' },
                    500: { description: 'Server error' },
                },
            },
        },
    },
};

export const allOrderDocs = {
    paths: {
        ...orderDocs.paths,
    },
};
