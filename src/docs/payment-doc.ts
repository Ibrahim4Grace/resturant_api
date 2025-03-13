export const paymentDocs = {
    paths: {
        '/api/v1/payment/initialize': {
            post: {
                summary: 'Initialize a payment',
                tags: ['Payments'],
                security: [{ BearerAuth: [] }],
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    orderId: {
                                        type: 'string',
                                        example: '65fd9c8a8eaf4a3b9c123456',
                                    },
                                    paymentMethod: {
                                        type: 'string',
                                        example: 'transfer',
                                    },
                                },
                                required: ['orderId', 'paymentMethod'],
                            },
                        },
                    },
                },
                responses: {
                    200: {
                        description: 'Payment initialized successfully',
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
                                                'Payment initialized successfully',
                                        },
                                        data: {
                                            type: 'object',
                                            properties: {
                                                authorization_url: {
                                                    type: 'string',
                                                    example:
                                                        'https://paystack.com/pay/xyz123',
                                                },
                                                reference: {
                                                    type: 'string',
                                                    example: 'xyz123456',
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
        },

        '/api/v1/payment/webhook': {
            post: {
                summary: 'Handle payment webhook',
                tags: ['Payments'],
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    event: {
                                        type: 'string',
                                        example: 'charge.success',
                                    },
                                    data: {
                                        type: 'object',
                                        properties: {
                                            reference: {
                                                type: 'string',
                                                example: 'xyz123456',
                                            },
                                            metadata: {
                                                type: 'object',
                                                properties: {
                                                    order_id: {
                                                        type: 'string',
                                                        example:
                                                            '65fd9c8a8eaf4a3b9c123456',
                                                    },
                                                    restaurant_id: {
                                                        type: 'string',
                                                        example:
                                                            '65fd9c8a8eaf4a3b9c654321',
                                                    },
                                                    user_id: {
                                                        type: 'string',
                                                        example:
                                                            '65fd9c8a8eaf4a3b9c987654',
                                                    },
                                                },
                                            },
                                        },
                                    },
                                },
                                required: ['event', 'data'],
                            },
                        },
                    },
                },
                responses: {
                    200: {
                        description: 'Webhook processed successfully',
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
                                                'Webhook processed successfully',
                                        },
                                    },
                                },
                            },
                        },
                    },
                    400: { description: 'Webhook processing failed' },
                },
            },
        },
    },
};
export const allpaymentDocs = {
    paths: {
        ...paymentDocs.paths,
    },
};
