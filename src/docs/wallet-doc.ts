export const walletDocs = {
    paths: {
        '/api/v1/wallet/restaurant/balance': {
            get: {
                summary: 'Get restaurant wallet balance',
                tags: ['Restaurant - Wallet'],
                security: [{ bearerAuth: [] }],
                responses: {
                    200: {
                        description: 'Wallet balance retrieved successfully',
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
                                                'Wallet balance retrieved successfully',
                                        },
                                        status_code: {
                                            type: 'number',
                                            example: 200,
                                        },
                                        data: {
                                            type: 'object',
                                            properties: {
                                                balance: {
                                                    type: 'number',
                                                    example: 5000,
                                                },
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },
                    401: {
                        description: 'Unauthorized - Invalid or missing token',
                    },
                    403: {
                        description:
                            'Forbidden - User is not a restaurant owner',
                    },
                    404: { description: 'Restaurant not found' },
                    500: { description: 'Server error' },
                },
            },
        },

        '/api/v1/wallet/restaurant/transactions': {
            get: {
                summary: 'Get restaurant wallet transactions with pagination',
                tags: ['Restaurant - Wallet'],
                security: [{ bearerAuth: [] }],
                parameters: [
                    {
                        in: 'query',
                        name: 'page',
                        schema: { type: 'integer', example: 1 },
                        description: 'Page number for pagination',
                    },
                    {
                        in: 'query',
                        name: 'limit',
                        schema: { type: 'integer', example: 6 },
                        description: 'Number of transactions per page',
                    },
                ],
                responses: {
                    200: {
                        description:
                            'Wallet transactions retrieved successfully',
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
                                                'Wallet transactions retrieved successfully',
                                        },
                                        status_code: {
                                            type: 'number',
                                            example: 200,
                                        },
                                        data: {
                                            type: 'object',
                                            properties: {
                                                transactions: {
                                                    type: 'object',
                                                    properties: {
                                                        results: {
                                                            type: 'array',
                                                            items: {
                                                                type: 'object',
                                                                properties: {
                                                                    amount: {
                                                                        type: 'number',
                                                                        example: 443.75,
                                                                    },
                                                                    type: {
                                                                        type: 'string',
                                                                        enum: [
                                                                            'credit',
                                                                            'debit',
                                                                        ],
                                                                        example:
                                                                            'credit',
                                                                    },
                                                                    description:
                                                                        {
                                                                            type: 'string',
                                                                            example:
                                                                                'Delivery commission for order #CR76789203',
                                                                        },
                                                                    reference: {
                                                                        type: 'string',
                                                                        example:
                                                                            'rider-commission-CR76789203',
                                                                    },
                                                                    status: {
                                                                        type: 'string',
                                                                        enum: [
                                                                            'pending',
                                                                            'completed',
                                                                            'failed',
                                                                        ],
                                                                        example:
                                                                            'completed',
                                                                    },
                                                                    createdAt: {
                                                                        type: 'string',
                                                                        format: 'date-time',
                                                                        example:
                                                                            '2025-03-08T17:25:25.298Z',
                                                                    },
                                                                    _id: {
                                                                        type: 'string',
                                                                        example:
                                                                            '67cc7d85c41dfc3a505f1066',
                                                                    },
                                                                },
                                                            },
                                                        },
                                                        pagination: {
                                                            type: 'object',
                                                            properties: {
                                                                currentPage: {
                                                                    type: 'integer',
                                                                    example: 1,
                                                                },
                                                                totalPages: {
                                                                    type: 'integer',
                                                                    example: 2,
                                                                },
                                                                limit: {
                                                                    type: 'integer',
                                                                    example: 6,
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
                        },
                    },
                    401: {
                        description: 'Unauthorized - Invalid or missing token',
                    },
                    403: {
                        description:
                            'Forbidden - User is not a restaurant owner',
                    },
                    404: { description: 'Restaurant not found' },
                    500: { description: 'Server error' },
                },
            },
        },

        '/api/v1/wallet/restaurant/withdraw': {
            post: {
                summary: 'Initiate a withdrawal from restaurant wallet',
                tags: ['Restaurant - Wallet'],
                security: [{ bearerAuth: [] }],
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    amount: { type: 'number', example: 1000 },
                                    bankCode: {
                                        type: 'string',
                                        example: '044',
                                    },
                                    accountNumber: {
                                        type: 'string',
                                        example: '0690000031',
                                    },
                                    accountName: {
                                        type: 'string',
                                        example: 'John Doe',
                                    },
                                },
                                required: [
                                    'amount',
                                    'bankCode',
                                    'accountNumber',
                                    'accountName',
                                ],
                            },
                        },
                    },
                },
                responses: {
                    200: {
                        description: 'Withdrawal initiated successfully',
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
                                                'Withdrawal initiated successfully',
                                        },
                                        status_code: {
                                            type: 'number',
                                            example: 200,
                                        },
                                        data: {
                                            type: 'object',
                                            properties: {
                                                reference: {
                                                    type: 'string',
                                                    example:
                                                        'withdrawal_1634567890123',
                                                },
                                                status: {
                                                    type: 'string',
                                                    example: 'pending',
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
                            'Bad request - Insufficient balance or invalid data',
                    },
                    401: {
                        description: 'Unauthorized - Invalid or missing token',
                    },
                    403: {
                        description:
                            'Forbidden - User is not a restaurant owner',
                    },
                    404: { description: 'Restaurant or wallet not found' },
                    500: { description: 'Server error' },
                },
            },
        },

        '/api/v1/wallet/rider/balance': {
            get: {
                summary: 'Get rider wallet balance',
                tags: ['Rider - Wallet'],
                security: [{ bearerAuth: [] }],
                responses: {
                    200: {
                        description: 'Wallet balance retrieved successfully',
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
                                                'Wallet balance retrieved successfully',
                                        },
                                        status_code: {
                                            type: 'number',
                                            example: 200,
                                        },
                                        data: {
                                            type: 'object',
                                            properties: {
                                                balance: {
                                                    type: 'number',
                                                    example: 3000,
                                                },
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },
                    401: {
                        description: 'Unauthorized - Invalid or missing token',
                    },
                    403: { description: 'Forbidden - User is not a rider' },
                    404: { description: 'Rider not found' },
                    500: { description: 'Server error' },
                },
            },
        },

        '/api/v1/wallet/rider/transactions': {
            get: {
                summary: 'Get rider wallet transactions with pagination',
                tags: ['Rider - Wallet'],
                security: [{ bearerAuth: [] }],
                parameters: [
                    {
                        in: 'query',
                        name: 'page',
                        schema: { type: 'integer', example: 1 },
                        description: 'Page number for pagination',
                    },
                    {
                        in: 'query',
                        name: 'limit',
                        schema: { type: 'integer', example: 6 },
                        description: 'Number of transactions per page',
                    },
                ],
                responses: {
                    200: {
                        description:
                            'Wallet transactions retrieved successfully',
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
                                                'Wallet transactions retrieved successfully',
                                        },
                                        status_code: {
                                            type: 'number',
                                            example: 200,
                                        },
                                        data: {
                                            type: 'object',
                                            properties: {
                                                transactions: {
                                                    type: 'object',
                                                    properties: {
                                                        results: {
                                                            type: 'array',
                                                            items: {
                                                                type: 'object',
                                                                properties: {
                                                                    amount: {
                                                                        type: 'number',
                                                                        example: 181.25,
                                                                    },
                                                                    type: {
                                                                        type: 'string',
                                                                        enum: [
                                                                            'credit',
                                                                            'debit',
                                                                        ],
                                                                        example:
                                                                            'credit',
                                                                    },
                                                                    description:
                                                                        {
                                                                            type: 'string',
                                                                            example:
                                                                                'Delivery commission for order #CR92704880',
                                                                        },
                                                                    reference: {
                                                                        type: 'string',
                                                                        example:
                                                                            'rider-commission-CR92704880',
                                                                    },
                                                                    status: {
                                                                        type: 'string',
                                                                        enum: [
                                                                            'pending',
                                                                            'completed',
                                                                            'failed',
                                                                        ],
                                                                        example:
                                                                            'completed',
                                                                    },
                                                                    createdAt: {
                                                                        type: 'string',
                                                                        format: 'date-time',
                                                                        example:
                                                                            '2025-03-09T11:00:03.171Z',
                                                                    },
                                                                    _id: {
                                                                        type: 'string',
                                                                        example:
                                                                            '67cd74b3e0d0356ad41e5494',
                                                                    },
                                                                },
                                                            },
                                                        },
                                                        pagination: {
                                                            type: 'object',
                                                            properties: {
                                                                currentPage: {
                                                                    type: 'integer',
                                                                    example: 1,
                                                                },
                                                                totalPages: {
                                                                    type: 'integer',
                                                                    example: 2,
                                                                },
                                                                limit: {
                                                                    type: 'integer',
                                                                    example: 6,
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
                        },
                    },
                    401: {
                        description: 'Unauthorized - Invalid or missing token',
                    },
                    403: { description: 'Forbidden - User is not a rider' },
                    404: { description: 'Rider not found' },
                    500: { description: 'Server error' },
                },
            },
        },

        '/api/v1/wallet/rider/withdraw': {
            post: {
                summary: 'Initiate a withdrawal from rider wallet',
                tags: ['Rider - Wallet'],
                security: [{ bearerAuth: [] }],
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    amount: { type: 'number', example: 500 },
                                    bankCode: {
                                        type: 'string',
                                        example: '033',
                                    },
                                    accountNumber: {
                                        type: 'string',
                                        example: '0123456789',
                                    },
                                    accountName: {
                                        type: 'string',
                                        example: 'Jane Doe',
                                    },
                                },
                                required: [
                                    'amount',
                                    'bankCode',
                                    'accountNumber',
                                    'accountName',
                                ],
                            },
                        },
                    },
                },
                responses: {
                    200: {
                        description: 'Withdrawal initiated successfully',
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
                                                'Withdrawal initiated successfully',
                                        },
                                        status_code: {
                                            type: 'number',
                                            example: 200,
                                        },
                                        data: {
                                            type: 'object',
                                            properties: {
                                                reference: {
                                                    type: 'string',
                                                    example:
                                                        'withdrawal_1634567890456',
                                                },
                                                status: {
                                                    type: 'string',
                                                    example: 'pending',
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
                            'Bad request - Insufficient balance or invalid data',
                    },
                    401: {
                        description: 'Unauthorized - Invalid or missing token',
                    },
                    403: { description: 'Forbidden - User is not a rider' },
                    404: { description: 'Rider or wallet not found' },
                    500: { description: 'Server error' },
                },
            },
        },
    },
    components: {
        schemas: {
            WalletTransaction: {
                type: 'object',
                properties: {
                    amount: { type: 'number' },
                    type: { type: 'string', enum: ['credit', 'debit'] },
                    description: { type: 'string' },
                    reference: { type: 'string' },
                    status: {
                        type: 'string',
                        enum: ['pending', 'completed', 'failed'],
                    },
                    createdAt: { type: 'string', format: 'date-time' },
                    _id: { type: 'string' },
                },
            },
            WalletPaginatedResponse: {
                type: 'object',
                properties: {
                    results: {
                        type: 'array',
                        items: {
                            $ref: '#/components/schemas/WalletTransaction',
                        },
                    },
                    pagination: {
                        type: 'object',
                        properties: {
                            currentPage: { type: 'integer' },
                            totalPages: { type: 'integer' },
                            limit: { type: 'integer' },
                        },
                    },
                },
            },
            WithdrawalRequest: {
                type: 'object',
                properties: {
                    amount: { type: 'number' },
                    bankCode: { type: 'string' },
                    accountNumber: { type: 'string' },
                    accountName: { type: 'string' },
                },
                required: [
                    'amount',
                    'bankCode',
                    'accountNumber',
                    'accountName',
                ],
            },
        },
    },
};

export const allWalletDocs = {
    paths: {
        ...walletDocs.paths,
    },
};
