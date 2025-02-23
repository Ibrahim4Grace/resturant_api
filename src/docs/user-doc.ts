export const authUserDocs = {
    paths: {
        '/api/v1/auth/users/register': {
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
        '/api/v1/auth/users/verify-otp': {
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
        '/api/v1/auth/users/forgot': {
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
        '/api/v1/auth/users/password/verify-otp': {
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
        '/api/v1/auth/users/password/reset': {
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
        '/api/v1/auth/users/login': {
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
