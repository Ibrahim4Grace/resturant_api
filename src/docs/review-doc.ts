export const reviewDocs = {
    paths: {
        '/api/v1/reviews': {
            post: {
                summary: 'Create a new review',
                tags: ['Reviews'],
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    userId: {
                                        type: 'string',
                                        example: '65f8c2b9e4b0a33c4b3cfd9a',
                                    },
                                    targetType: {
                                        type: 'string',
                                        enum: ['restaurant', 'menu'],
                                        example: 'restaurant',
                                    },
                                    targetId: {
                                        type: 'string',
                                        example: '65f8c2b9e4b0a33c4b3cfd9b',
                                    },
                                    rating: { type: 'number', example: 4.5 },
                                    comment: {
                                        type: 'string',
                                        example: 'Great food and service!',
                                    },
                                },
                                required: [
                                    'userId',
                                    'targetType',
                                    'targetId',
                                    'rating',
                                ],
                            },
                        },
                    },
                },
                responses: {
                    201: {
                        description: 'Review created successfully.',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        success: {
                                            type: 'boolean',
                                            example: true,
                                        },
                                        data: { type: 'object' },
                                    },
                                },
                            },
                        },
                    },
                    400: { description: 'Invalid request data' },
                    404: { description: 'Restaurant/Menu not found' },
                    500: { description: 'Server error' },
                },
            },

            get: {
                summary: 'Get paginated reviews',
                tags: ['Reviews'],
                parameters: [
                    {
                        name: 'page',
                        in: 'query',
                        schema: { type: 'integer', example: 1 },
                    },
                    {
                        name: 'limit',
                        in: 'query',
                        schema: { type: 'integer', example: 10 },
                    },
                ],
                responses: {
                    200: {
                        description: 'Successfully retrieved reviews',
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
                                                    userId: { type: 'string' },
                                                    targetType: {
                                                        type: 'string',
                                                    },
                                                    targetId: {
                                                        type: 'string',
                                                    },
                                                    rating: { type: 'number' },
                                                    comment: { type: 'string' },
                                                    createdAt: {
                                                        type: 'string',
                                                    },
                                                },
                                            },
                                        },
                                        pagination: {
                                            type: 'object',
                                            properties: {
                                                currentPage: {
                                                    type: 'integer',
                                                },
                                                totalPages: { type: 'integer' },
                                                limit: { type: 'integer' },
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
        },

        '/api/v1/reviews/{reviewId}': {
            put: {
                summary: 'Update a review',
                tags: ['Reviews'],
                parameters: [
                    {
                        name: 'reviewId',
                        in: 'path',
                        required: true,
                        schema: { type: 'string' },
                    },
                ],
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    rating: { type: 'number', example: 5 },
                                    comment: {
                                        type: 'string',
                                        example: 'Updated review comment',
                                    },
                                },
                            },
                        },
                    },
                },
                responses: {
                    200: { description: 'Review updated successfully' },
                    404: { description: 'Review not found' },
                    500: { description: 'Server error' },
                },
            },

            delete: {
                summary: 'Delete a review',
                tags: ['Reviews'],
                parameters: [
                    {
                        name: 'reviewId',
                        in: 'path',
                        required: true,
                        schema: { type: 'string' },
                    },
                ],
                responses: {
                    200: { description: 'Review deleted successfully' },
                    404: { description: 'Review not found' },
                    500: { description: 'Server error' },
                },
            },
        },

        '/api/v1/reviews/target/{targetType}/{targetId}': {
            get: {
                summary: 'Get reviews for a specific restaurant or menu item',
                tags: ['Reviews'],
                parameters: [
                    {
                        name: 'targetType',
                        in: 'path',
                        required: true,
                        schema: {
                            type: 'string',
                            enum: ['restaurant', 'menu'],
                        },
                    },
                    {
                        name: 'targetId',
                        in: 'path',
                        required: true,
                        schema: { type: 'string' },
                    },
                ],
                responses: {
                    200: { description: 'Reviews retrieved successfully' },
                    500: { description: 'Server error' },
                },
            },
        },
    },
};

export const allreviewDocs = {
    paths: {
        ...reviewDocs.paths,
    },
};
