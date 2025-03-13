export const orderDocs = {
    paths: {
        '/api/v1/order': {
            post: {
                summary: 'Place a new order',
                tags: ['User - Orders'],
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
                                                    example: '64f1b7d4c7e8a',
                                                },
                                                quantity: {
                                                    type: 'number',
                                                    example: 2,
                                                },
                                            },
                                        },
                                    },
                                    restaurantId: {
                                        type: 'string',
                                        example: '65a9c8e7f0d3b',
                                    },
                                    delivery_address: {
                                        type: 'string',
                                        example:
                                            '123 Main Street, New York, NY',
                                    },
                                    payment_method: {
                                        type: 'string',
                                        enum: ['cash_on_delivery', 'transfer'],
                                        example: 'cash_on_delivery',
                                    },
                                },
                                required: [
                                    'items',
                                    'restaurantId',
                                    'delivery_address',
                                    'payment_method',
                                ],
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
                                                order_number: {
                                                    type: 'string',
                                                    example: 'ORD123456',
                                                },
                                                userId: {
                                                    type: 'string',
                                                    example: '65a9c8e7f0d3b',
                                                },
                                                delivery_info: {
                                                    type: 'object',
                                                    properties: {
                                                        delivery_address: {
                                                            type: 'string',
                                                            example:
                                                                '123 Main Street, New York, NY',
                                                        },
                                                    },
                                                },
                                                restaurantId: {
                                                    type: 'string',
                                                    example: '65a9c8e7f0d3b',
                                                },
                                                items: {
                                                    type: 'array',
                                                    items: {
                                                        type: 'object',
                                                        properties: {
                                                            menuId: {
                                                                type: 'string',
                                                                example:
                                                                    '64f1b7d4c7e8a',
                                                            },
                                                            quantity: {
                                                                type: 'number',
                                                                example: 2,
                                                            },
                                                            price: {
                                                                type: 'number',
                                                                example: 15.99,
                                                            },
                                                        },
                                                    },
                                                },
                                                subtotal: {
                                                    type: 'number',
                                                    example: 31.98,
                                                },
                                                tax: {
                                                    type: 'number',
                                                    example: 2.5,
                                                },
                                                delivery_fee: {
                                                    type: 'number',
                                                    example: 5.0,
                                                },
                                                total_price: {
                                                    type: 'number',
                                                    example: 39.48,
                                                },
                                                payment_method: {
                                                    type: 'string',
                                                    example: 'cash_on_delivery',
                                                },
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },
                    400: {
                        description: 'Validation error',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        errors: {
                                            type: 'array',
                                            items: {
                                                type: 'object',
                                                properties: {
                                                    field: {
                                                        type: 'string',
                                                        example:
                                                            'payment_method',
                                                    },
                                                    message: {
                                                        type: 'string',
                                                        example:
                                                            'Payment method must be either cash_on_delivery or transfer',
                                                    },
                                                },
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },
                    500: { description: 'Server error' },
                },
            },
            '/api/v1/orders': {
                get: {
                    summary: 'Get all orders for  user',
                    tags: ['Restaurant - Orders'],
                    security: [{ BearerAuth: [] }],
                    parameters: [
                        {
                            in: 'query',
                            name: 'page',
                            schema: { type: 'integer', default: 1 },
                            description: 'Page number for pagination',
                        },
                        {
                            in: 'query',
                            name: 'limit',
                            schema: { type: 'integer', default: 10 },
                            description: 'Number of items per page',
                        },
                    ],
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
                                            total: {
                                                type: 'integer',
                                                example: 50,
                                            },
                                            page: {
                                                type: 'integer',
                                                example: 1,
                                            },
                                            limit: {
                                                type: 'integer',
                                                example: 10,
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
        },

        paths: {
            '/api/v1/order/{id}/status': {
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
            paths: {
                '/api/v1/orders/cash-on-delivery-orders': {
                    get: {
                        summary: 'Get all cash-on-delivery orders',
                        tags: ['Admin - Orders'],
                        security: [{ BearerAuth: [] }],
                        parameters: [
                            {
                                name: 'page',
                                in: 'query',
                                required: false,
                                schema: {
                                    type: 'integer',
                                    example: 1,
                                },
                                description: 'Page number for pagination',
                            },
                            {
                                name: 'limit',
                                in: 'query',
                                required: false,
                                schema: {
                                    type: 'integer',
                                    example: 10,
                                },
                                description: 'Number of results per page',
                            },
                        ],
                        responses: {
                            200: {
                                description:
                                    'Cash-on-delivery orders retrieved successfully',
                                content: {
                                    'application/json': {
                                        schema: {
                                            type: 'object',
                                            properties: {
                                                results: {
                                                    type: 'array',
                                                    items: {
                                                        type: 'object',
                                                        properties: {
                                                            order_number: {
                                                                type: 'string',
                                                                example:
                                                                    'ORD12345',
                                                            },
                                                            userId: {
                                                                type: 'string',
                                                                example:
                                                                    'user_abc123',
                                                            },
                                                            restaurantId: {
                                                                type: 'string',
                                                                example:
                                                                    'resto_xyz456',
                                                            },
                                                            payment_method: {
                                                                type: 'string',
                                                                example:
                                                                    'cash_on_delivery',
                                                            },
                                                            subtotal: {
                                                                type: 'number',
                                                                example: 5000,
                                                            },
                                                            tax: {
                                                                type: 'number',
                                                                example: 500,
                                                            },
                                                            delivery_fee: {
                                                                type: 'number',
                                                                example: 300,
                                                            },
                                                            total_price: {
                                                                type: 'number',
                                                                example: 5800,
                                                            },
                                                            status: {
                                                                type: 'string',
                                                                example:
                                                                    'pending',
                                                            },
                                                        },
                                                    },
                                                },
                                                pagination: {
                                                    type: 'object',
                                                    properties: {
                                                        totalItems: {
                                                            type: 'integer',
                                                            example: 100,
                                                        },
                                                        totalPages: {
                                                            type: 'integer',
                                                            example: 10,
                                                        },
                                                        currentPage: {
                                                            type: 'integer',
                                                            example: 1,
                                                        },
                                                        pageSize: {
                                                            type: 'integer',
                                                            example: 10,
                                                        },
                                                    },
                                                },
                                            },
                                        },
                                    },
                                },
                            },
                            401: { description: 'Unauthorized' },
                            403: { description: 'Forbidden' },
                            500: { description: 'Server error' },
                        },
                    },
                },
            },
            '/api/v1/order/{orderId}/confirm-delivery': {
                post: {
                    summary: 'Confirm delivery of an order',
                    tags: ['restaurant - Orders'],
                    security: [{ BearerAuth: [] }],
                    parameters: [
                        {
                            name: 'orderId',
                            in: 'path',
                            required: true,
                            schema: {
                                type: 'string',
                                example: '60d21b4667d0d8992e610c85',
                            },
                            description:
                                'The ID of the order to confirm delivery for',
                        },
                    ],
                    responses: {
                        200: {
                            description: 'Delivery confirmed successfully',
                            content: {
                                'application/json': {
                                    schema: {
                                        type: 'object',
                                        properties: {
                                            success: {
                                                type: 'boolean',
                                                example: true,
                                            },
                                            message: {
                                                type: 'string',
                                                example:
                                                    'Delivery confirmed successfully',
                                            },
                                            data: {
                                                type: 'object',
                                                properties: {
                                                    id: {
                                                        type: 'string',
                                                        example:
                                                            '60d21b4667d0d8992e610c85',
                                                    },
                                                    userId: {
                                                        type: 'string',
                                                        example:
                                                            '609bda561452242d88d36e37',
                                                    },
                                                    status: {
                                                        type: 'string',
                                                        example: 'delivered',
                                                    },
                                                    delivery_confirmed: {
                                                        type: 'boolean',
                                                        example: true,
                                                    },
                                                    delivery_info: {
                                                        type: 'object',
                                                        properties: {
                                                            customerConfirmationTime:
                                                                {
                                                                    type: 'string',
                                                                    format: 'date-time',
                                                                    example:
                                                                        '2024-03-09T12:00:00Z',
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
                        400: {
                            description:
                                'Cannot confirm delivery for an order that is not marked as delivered',
                        },
                        401: {
                            description:
                                'Unauthorized - User is not authorized to confirm this delivery',
                        },
                        404: {
                            description: 'Order not found',
                        },
                        500: {
                            description: 'Server error',
                        },
                    },
                },
            },
        },
        '/api/v1/order/{id}': {
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
