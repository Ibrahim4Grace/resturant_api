export const authAdminDocs = {
    paths: {
        '/api/v1/auth/admins/register': {
            post: {
                summary: 'Register a new user',
                tags: ['Authenticate - Admin'],
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
        '/api/v1/auth/admins/verify-otp': {
            post: {
                summary: 'Verify OTP for registration',
                tags: ['Authenticate - Admin'],
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
        '/api/v1/auth/admins/forgot': {
            post: {
                summary: 'Request password reset',
                tags: ['Authenticate - Admin'],
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
        '/api/v1/auth/admins/password/verify-otp': {
            post: {
                summary: 'Verify OTP for password reset',
                tags: ['Authenticate - Admin'],
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
        '/api/v1/auth/admins/password/reset': {
            post: {
                summary: 'Reset password using reset token and OTP',
                tags: ['Authenticate - Admin'],
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
        '/api/v1/auth/admins/login': {
            post: {
                summary: 'Login with email and password',
                tags: ['Authenticate - Admin'],
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

export const adminDocs = {
    paths: {
        '/api/v1/admins': {
            get: {
                summary: 'Retrieve all admins',
                tags: ['Admin - Admins'],
                security: [{ BearerAuth: [] }],
                responses: {
                    200: {
                        description: 'Admins retrieved successfully.',
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
                                                'Admins retrieve successful',
                                        },
                                        data: {
                                            type: 'array',
                                            items: {
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
        },
        '/api/v1/admins/admin/{id}': {
            get: {
                summary: 'Retrieve a admin by ID',
                tags: ['Admin - Admins'],
                security: [{ BearerAuth: [] }],
                parameters: [
                    {
                        name: 'id',
                        in: 'path',
                        required: true,
                        schema: {
                            type: 'string',
                            example: '64b1234567890abc12345678',
                        },
                    },
                ],
                responses: {
                    200: {
                        description: 'Admin retrieved successfully by ID.',
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
                                                'Admin retrieve by ID successful',
                                        },
                                        data: {
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
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },
                    404: { description: 'Admin not found' },
                    500: { description: 'Server error' },
                },
            },
            delete: {
                summary: 'Delete a rider by ID',
                tags: ['Admin - Admins'],
                security: [{ BearerAuth: [] }],
                parameters: [
                    {
                        name: 'id',
                        in: 'path',
                        required: true,
                        schema: {
                            type: 'string',
                            example: '64b1234567890abc12345678',
                        },
                    },
                ],
                responses: {
                    200: {
                        description: 'Admin deleted successfully.',
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
                                                'Admin deleted successfully',
                                        },
                                    },
                                },
                            },
                        },
                    },
                    404: { description: 'Admin not found' },
                    500: { description: 'Server error' },
                },
            },
        },
        '/api/v1/admins/users': {
            get: {
                summary: 'Retrieve all users',
                tags: ['Admin - Users'],
                security: [{ BearerAuth: [] }],
                responses: {
                    200: {
                        description: 'Users retrieved successfully.',
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
                                                'Users retrieve successful',
                                        },
                                        data: {
                                            type: 'array',
                                            items: {
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
                                                    role: {
                                                        type: 'string',
                                                        example: 'user',
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
        },
        '/api/v1/admins/user/{id}': {
            get: {
                summary: 'Retrieve a user by ID',
                tags: ['Admin - Users'],
                security: [{ BearerAuth: [] }],
                parameters: [
                    {
                        name: 'id',
                        in: 'path',
                        required: true,
                        schema: {
                            type: 'string',
                            example: '64b1234567890abc12345678',
                        },
                    },
                ],
                responses: {
                    200: {
                        description: 'User retrieved successfully by ID.',
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
                                                'Users retrieve by ID successful',
                                        },
                                        data: {
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
                                                role: {
                                                    type: 'string',
                                                    example: 'user',
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
            delete: {
                summary: 'Delete a user by ID',
                tags: ['Admin - Users'],
                security: [{ BearerAuth: [] }],
                parameters: [
                    {
                        name: 'id',
                        in: 'path',
                        required: true,
                        schema: {
                            type: 'string',
                            example: '64b1234567890abc12345678',
                        },
                    },
                ],
                responses: {
                    200: {
                        description: 'User deleted successfully.',
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
                                                'User deleted successfully',
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
        '/api/v1/admins/restaurants': {
            get: {
                summary: 'Retrieve all restaurants',
                tags: ['Admin - Restaurants'],
                security: [{ BearerAuth: [] }],
                responses: {
                    200: {
                        description: 'Restaurants retrieved successfully.',
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
                                                'Restaurants retrieve successful',
                                        },
                                        data: {
                                            type: 'array',
                                            items: {
                                                type: 'object',
                                                properties: {
                                                    name: {
                                                        type: 'string',
                                                        example: 'Pizza Place',
                                                    },
                                                    email: {
                                                        type: 'string',
                                                        example:
                                                            'contact@pizzaplace.com',
                                                    },
                                                    ownerId: {
                                                        type: 'string',
                                                        example:
                                                            '64b1234567890abc12345678',
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
        },
        '/api/v1/admins/restaurant/{id}': {
            get: {
                summary: 'Retrieve a restaurant by ID',
                tags: ['Admin - Restaurants'],
                security: [{ BearerAuth: [] }],
                parameters: [
                    {
                        name: 'id',
                        in: 'path',
                        required: true,
                        schema: {
                            type: 'string',
                            example: '64b1234567890abc12345678',
                        },
                    },
                ],
                responses: {
                    200: {
                        description: 'Restaurant retrieved successfully by ID.',
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
                                                'Restaurant retrieve by ID successful',
                                        },
                                        data: {
                                            type: 'object',
                                            properties: {
                                                name: {
                                                    type: 'string',
                                                    example: 'Pizza Place',
                                                },
                                                email: {
                                                    type: 'string',
                                                    example:
                                                        'contact@pizzaplace.com',
                                                },
                                                ownerId: {
                                                    type: 'string',
                                                    example:
                                                        '64b1234567890abc12345678',
                                                },
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },
                    404: { description: 'Restaurant not found' },
                    500: { description: 'Server error' },
                },
            },
            delete: {
                summary: 'Delete a restaurant by ID',
                tags: ['Admin - Restaurants'],
                security: [{ BearerAuth: [] }],
                parameters: [
                    {
                        name: 'id',
                        in: 'path',
                        required: true,
                        schema: {
                            type: 'string',
                            example: '64b1234567890abc12345678',
                        },
                    },
                ],
                responses: {
                    200: {
                        description: 'Restaurant deleted successfully.',
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
                                                'Restaurant deleted successfully',
                                        },
                                    },
                                },
                            },
                        },
                    },
                    404: { description: 'Restaurant not found' },
                    500: { description: 'Server error' },
                },
            },
        },

        '/api/v1/admins/riders': {
            get: {
                summary: 'Retrieve all riders',
                tags: ['Admin - Riders'],
                security: [{ BearerAuth: [] }],
                responses: {
                    200: {
                        description: 'riders retrieved successfully.',
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
                                                'Users retrieve successful',
                                        },
                                        data: {
                                            type: 'array',
                                            items: {
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
                                                    role: {
                                                        type: 'string',
                                                        example: 'user',
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
        },
        '/api/v1/admins/rider/{id}': {
            get: {
                summary: 'Retrieve a rider by ID',
                tags: ['Admin - Riders'],
                security: [{ BearerAuth: [] }],
                parameters: [
                    {
                        name: 'id',
                        in: 'path',
                        required: true,
                        schema: {
                            type: 'string',
                            example: '64b1234567890abc12345678',
                        },
                    },
                ],
                responses: {
                    200: {
                        description: 'Rider retrieved successfully by ID.',
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
                                                'riders retrieve by ID successful',
                                        },
                                        data: {
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
                                                role: {
                                                    type: 'string',
                                                    example: 'user',
                                                },
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },
                    404: { description: 'riders not found' },
                    500: { description: 'Server error' },
                },
            },
            delete: {
                summary: 'Delete a rider by ID',
                tags: ['Admin - Riders'],
                security: [{ BearerAuth: [] }],
                parameters: [
                    {
                        name: 'id',
                        in: 'path',
                        required: true,
                        schema: {
                            type: 'string',
                            example: '64b1234567890abc12345678',
                        },
                    },
                ],
                responses: {
                    200: {
                        description: 'rider deleted successfully.',
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
                                                'Rider deleted successfully',
                                        },
                                    },
                                },
                            },
                        },
                    },
                    404: { description: 'Rider not found' },
                    500: { description: 'Server error' },
                },
            },
        },
        '/api/v1/admins/orders': {
            get: {
                summary: 'Retrieve all orders',
                tags: ['Admin - Orders'],
                security: [{ BearerAuth: [] }],
                responses: {
                    200: {
                        description: 'orders retrieved successfully.',
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
                                                'orders retrieve successful',
                                        },
                                        data: {
                                            type: 'array',
                                            items: {
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
        },
        '/api/v1/admins/order/{id}': {
            get: {
                summary: 'Retrieve a order by ID',
                tags: ['Admin - Orders'],
                security: [{ BearerAuth: [] }],
                parameters: [
                    {
                        name: 'id',
                        in: 'path',
                        required: true,
                        schema: {
                            type: 'string',
                            example: '64b1234567890abc12345678',
                        },
                    },
                ],
                responses: {
                    200: {
                        description: 'Order retrieved successfully by ID.',
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
                                                'orders retrieve by ID successful',
                                        },
                                        data: {
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
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },
                    404: { description: 'orders not found' },
                    500: { description: 'Server error' },
                },
            },
            delete: {
                summary: 'Delete a order by ID',
                tags: ['Admin - Orders'],
                security: [{ BearerAuth: [] }],
                parameters: [
                    {
                        name: 'id',
                        in: 'path',
                        required: true,
                        schema: {
                            type: 'string',
                            example: '64b1234567890abc12345678',
                        },
                    },
                ],
                responses: {
                    200: {
                        description: 'order deleted successfully.',
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
                                                'order deleted successfully',
                                        },
                                    },
                                },
                            },
                        },
                    },
                    404: { description: 'order not found' },
                    500: { description: 'Server error' },
                },
            },
        },
    },
};

export const allAdminDocs = {
    paths: {
        ...authAdminDocs.paths,
        ...adminDocs.paths,
    },
};
