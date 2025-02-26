export const authUserDocs = {
    paths: {
        '/api/v1/auth/user/register': {
            post: {
                summary: 'Register a new user',
                tags: ['Authenticate - User'],
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    name: {
                                        type: 'string',
                                        example: 'John Doe',
                                    },
                                    email: {
                                        type: 'string',
                                        example: 'john.doe@example.com',
                                    },
                                    password: {
                                        type: 'string',
                                        example: 'strongpassword123',
                                    },
                                    phone: {
                                        type: 'number',
                                        example: '08097654321',
                                    },
                                    street: {
                                        type: 'string',
                                        example: '123 mary ave',
                                    },
                                    city: {
                                        type: 'string',
                                        example: 'Ikeja',
                                    },
                                    state: {
                                        type: 'string',
                                        example: 'LA',
                                    },
                                },
                            },
                        },
                    },
                },
                responses: {
                    201: {
                        description:
                            'Registration successful. Please verify your email with the OTP sent.',
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
                                                'Registration initiated. Please verify your email with the OTP sent.',
                                        },
                                        user: {
                                            type: 'object',
                                            properties: {
                                                name: {
                                                    type: 'string',
                                                    example: 'John Doe',
                                                },
                                                email: {
                                                    type: 'string',
                                                    example:
                                                        'john.doe@example.com',
                                                },
                                                isEmailVerified: {
                                                    type: 'boolean',
                                                    example: false,
                                                },
                                            },
                                        },
                                        verificationToken: {
                                            type: 'string',
                                            example: 'jwt-verification-token',
                                        },
                                    },
                                },
                            },
                        },
                    },
                    409: { description: 'Email already registered' },
                    500: { description: 'Server error' },
                },
            },
        },
        '/api/v1/auth/user/verify-otp': {
            post: {
                summary: 'Verify OTP for registration',
                tags: ['Authenticate - User'],
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    otp: { type: 'string', example: '123456' },
                                },
                            },
                        },
                    },
                },
                responses: {
                    200: {
                        description:
                            'Email verified successfully. You can now log in.',
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
                                                'Email verified successfully. You can now log in.',
                                        },
                                    },
                                },
                            },
                        },
                    },
                    400: {
                        description: 'Invalid or expired verification session',
                    },
                    500: { description: 'Server error' },
                },
            },
        },
        '/api/v1/auth/user/forgot': {
            post: {
                summary: 'Request password reset',
                tags: ['Authenticate - User'],
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    email: {
                                        type: 'string',
                                        example: 'john.doe@example.com',
                                    },
                                },
                            },
                        },
                    },
                },
                responses: {
                    200: {
                        description:
                            'Reset token generated and OTP sent to your email.',
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
                                                'Reset token generated and OTP sent to your email.',
                                        },
                                        resetToken: {
                                            type: 'string',
                                            example: 'jwt-reset-token',
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
        '/api/v1/auth/user/password/verify-otp': {
            post: {
                summary: 'Verify OTP for password reset',
                tags: ['Authenticate - User'],
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    otp: { type: 'string', example: '654321' },
                                },
                            },
                        },
                    },
                },
                responses: {
                    200: {
                        description:
                            'OTP verified successfully. You can now reset your password.',
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
                                                'OTP verified successfully. You can now reset your password.',
                                        },
                                    },
                                },
                            },
                        },
                    },
                    400: { description: 'Invalid or expired reset token' },
                    500: { description: 'Server error' },
                },
            },
        },
        '/api/v1/auth/user/password/reset': {
            post: {
                summary: 'Reset password using reset token and OTP',
                tags: ['Authenticate - User'],
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    newPassword: {
                                        type: 'string',
                                        example: 'newstrongpassword123',
                                    },
                                },
                            },
                        },
                    },
                },
                responses: {
                    200: {
                        description: 'Password reset successfully.',
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
                                                'Password reset successfully.',
                                        },
                                    },
                                },
                            },
                        },
                    },
                    400: { description: 'Invalid or expired reset token' },
                    500: { description: 'Server error' },
                },
            },
        },
        '/api/v1/auth/user/login': {
            post: {
                summary: 'Login with email and password',
                tags: ['Authenticate - User'],
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    email: {
                                        type: 'string',
                                        example: 'john.doe@example.com',
                                    },
                                    password: {
                                        type: 'string',
                                        example: 'strongpassword123',
                                    },
                                },
                            },
                        },
                    },
                },
                responses: {
                    200: {
                        description: 'Login successful.',
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
                                            example: 'Login successful.',
                                        },
                                        user: {
                                            type: 'object',
                                            properties: {
                                                name: {
                                                    type: 'string',
                                                    example: 'John Doe',
                                                },
                                                email: {
                                                    type: 'string',
                                                    example:
                                                        'john.doe@example.com',
                                                },
                                                isEmailVerified: {
                                                    type: 'boolean',
                                                    example: true,
                                                },
                                            },
                                        },
                                        token: {
                                            type: 'string',
                                            example: 'jwt-auth-token',
                                        },
                                    },
                                },
                            },
                        },
                    },
                    401: { description: 'Invalid email or password' },
                    403: { description: 'Email not verified' },
                    500: { description: 'Server error' },
                },
            },
        },
    },
};

export const userDocs = {
    paths: {
        '/api/v1/user/profile': {
            get: {
                summary: 'Get user profile',
                tags: ['User'],
                security: [{ BearerAuth: [] }],
                responses: {
                    200: {
                        description: 'User profile retrieved successfully',
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
                                                'User retrieved successfully',
                                        },
                                        data: {
                                            $ref: '#/components/schemas/User',
                                        },
                                    },
                                },
                            },
                        },
                    },
                    404: { description: 'User not found' },
                },
            },
            put: {
                summary: 'Update user profile',
                tags: ['User'],
                security: [{ BearerAuth: [] }],
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: { $ref: '#/components/schemas/UserUpdate' },
                        },
                    },
                },
                responses: {
                    200: { description: 'User updated successfully' },
                    404: { description: 'User not found' },
                },
            },
        },
        '/api/v1/user/address': {
            post: {
                summary: 'Add new address',
                tags: ['User'],
                security: [{ BearerAuth: [] }],
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: { $ref: '#/components/schemas/Address' },
                        },
                    },
                },
                responses: {
                    201: { description: 'Address added successfully' },
                    409: { description: 'Duplicate address' },
                },
            },
            get: {
                summary: 'Get user addresses',
                tags: ['User'],
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
                        description: 'Addresses retrieved successfully',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        total: { type: 'integer' },
                                        page: { type: 'integer' },
                                        limit: { type: 'integer' },
                                        addresses: {
                                            type: 'array',
                                            items: {
                                                type: 'object',
                                                properties: {
                                                    id: { type: 'string' },
                                                    street: { type: 'string' },
                                                    city: { type: 'string' },
                                                    state: { type: 'string' },
                                                    zip: { type: 'string' },
                                                },
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },
                    404: { description: 'User not found' },
                },
            },
        },
        '/api/v1/user/address/{addressId}': {
            get: {
                summary: 'Get address by ID',
                tags: ['User'],
                security: [{ BearerAuth: [] }],
                parameters: [
                    {
                        in: 'path',
                        name: 'addressId',
                        required: true,
                        schema: { type: 'string' },
                    },
                ],
                responses: {
                    200: { description: 'Address retrieved successfully' },
                    404: { description: 'Address not found' },
                },
            },
            delete: {
                summary: 'Delete address',
                tags: ['User'],
                security: [{ BearerAuth: [] }],
                parameters: [
                    {
                        in: 'path',
                        name: 'addressId',
                        required: true,
                        schema: { type: 'string' },
                    },
                ],
                responses: {
                    200: { description: 'Address deleted successfully' },
                    404: { description: 'Address not found' },
                },
            },
        },
        '/api/v1/user/orders': {
            get: {
                summary: 'Get user orders',
                tags: ['User'],
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
                                        total: { type: 'integer' },
                                        page: { type: 'integer' },
                                        limit: { type: 'integer' },
                                        addresses: {
                                            type: 'array',
                                            items: {
                                                type: 'object',
                                                properties: {
                                                    id: { type: 'string' },
                                                    street: { type: 'string' },
                                                    city: { type: 'string' },
                                                    state: { type: 'string' },
                                                    zip: { type: 'string' },
                                                },
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },
                    404: { description: 'Order not found' },
                },
            },
        },
        '/api/v1/user/orders/{orderId}': {
            get: {
                summary: 'Get user order by ID',
                tags: ['User'],
                security: [{ BearerAuth: [] }],
                parameters: [
                    {
                        in: 'path',
                        name: 'orderId',
                        required: true,
                        schema: { type: 'string' },
                    },
                ],
                responses: {
                    200: { description: 'Order retrieved successfully' },
                    404: { description: 'Order not found' },
                },
            },
        },
        '/api/v1/user/reviews': {
            get: {
                summary: 'Get user reviews',
                tags: ['User', 'Reviews'],
                security: [{ BearerAuth: [] }],
                responses: {
                    200: {
                        description: 'Reviews retrieved successfully',
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
                                                'Reviews retrieved successfully',
                                        },
                                        data: {
                                            type: 'object',
                                            properties: {
                                                results: {
                                                    type: 'array',
                                                    items: {
                                                        type: 'object',
                                                        properties: {
                                                            userId: {
                                                                type: 'string',
                                                                example:
                                                                    '678f49a7dcba8c2840bc622c',
                                                            },
                                                            targetType: {
                                                                type: 'string',
                                                                example:
                                                                    'restaurant',
                                                            },
                                                            targetId: {
                                                                type: 'string',
                                                                example:
                                                                    '678fd14bf0db6a5013468482',
                                                            },
                                                            rating: {
                                                                type: 'number',
                                                                example: 4,
                                                            },
                                                            comment: {
                                                                type: 'string',
                                                                example:
                                                                    'Great experience!',
                                                            },
                                                            createdAt: {
                                                                type: 'string',
                                                                format: 'date-time',
                                                                example:
                                                                    '2025-02-25T05:06:31.655Z',
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
                                                            example: 5,
                                                        },
                                                        limit: {
                                                            type: 'number',
                                                            example: 10,
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
                        description: 'Unauthorized - User not authenticated',
                    },
                    404: {
                        description:
                            'User not authenticated or reviews not found',
                    },
                    500: { description: 'Server error' },
                },
            },
        },
    },
    components: {
        schemas: {
            User: {
                type: 'object',
                properties: {
                    full_name: { type: 'string', example: 'John Doe' },
                    email: { type: 'string', example: 'john.doe@example.com' },
                },
            },
            UserUpdate: {
                type: 'object',
                properties: {
                    full_name: { type: 'string', example: 'John Doe' },
                },
            },
            Address: {
                type: 'object',
                properties: {
                    street: { type: 'string', example: '123 Main St' },
                    city: { type: 'string', example: 'New York' },
                    state: { type: 'string', example: 'NY' },
                },
            },
        },
    },
};

export const allUserDocs = {
    paths: {
        ...authUserDocs.paths,
        ...userDocs.paths,
    },
};
