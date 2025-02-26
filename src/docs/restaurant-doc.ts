export const authRestaurantDocs = {
    paths: {
        '/api/v1/auth/restaurant/register': {
            post: {
                summary: 'Register a new restaurant',
                tags: ['Authenticate - Restaurant'],
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
        '/api/v1/auth/restaurant/verify-otp': {
            post: {
                summary: 'Verify OTP for registration',
                tags: ['Authenticate - Restaurant'],
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
        '/api/v1/auth/restaurant/forgot': {
            post: {
                summary: 'Request password reset',
                tags: ['Authenticate - Restaurant'],
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
        '/api/v1/auth/restaurant/password/verify-otp': {
            post: {
                summary: 'Verify OTP for password reset',
                tags: ['Authenticate - Restaurant'],
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
        '/api/v1/auth/restaurant/password/reset': {
            post: {
                summary: 'Reset password using reset token and OTP',
                tags: ['Authenticate - Restaurant'],
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
        '/api/v1/auth/restaurant/login': {
            post: {
                summary: 'Login with email and password',
                tags: ['Authenticate - Restaurant'],
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

export const restaurantDocs = {
    paths: {
        '/api/v1/restaurant/register': {
            post: {
                summary: 'User decide to Create restaurant',
                tags: ['Restaurant'],
                security: [{ bearerAuth: [] }],
                requestBody: {
                    required: true,
                    content: {
                        'multipart/form-data': {
                            schema: {
                                type: 'object',
                                properties: {
                                    name: {
                                        type: 'string',
                                        example: 'The Gourmet Spot',
                                    },
                                    password: {
                                        type: 'string',
                                        example: 'strongpassword123',
                                    },
                                    phone: {
                                        type: 'string',
                                        example: '+1234567890',
                                    },
                                    street: {
                                        type: 'string',
                                        example: '123 Culinary Blvd',
                                    },
                                    city: {
                                        type: 'string',
                                        example: 'Foodtown',
                                    },
                                    state: {
                                        type: 'string',
                                        example: 'Tasteville',
                                    },
                                    businessLicense: {
                                        type: 'string',
                                        format: 'binary',
                                    },
                                },
                            },
                        },
                    },
                },
                responses: {
                    201: {
                        description: 'Restaurant successfully created',
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
                                                'Restaurant successfully created',
                                        },
                                        data: {
                                            type: 'object',
                                            properties: {
                                                restaurant: {
                                                    type: 'object',
                                                    properties: {
                                                        id: {
                                                            type: 'string',
                                                            example:
                                                                '1234567890abcdef',
                                                        },
                                                        name: {
                                                            type: 'string',
                                                            example:
                                                                'The Gourmet Spot',
                                                        },
                                                        email: {
                                                            type: 'string',
                                                            example:
                                                                'owner@example.com',
                                                        },
                                                        status: {
                                                            type: 'string',
                                                            example: 'pending',
                                                        },
                                                    },
                                                },
                                                token: {
                                                    type: 'string',
                                                    example: 'auth_token',
                                                },
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },
                    400: { description: 'Invalid input data' },
                    401: { description: 'User not authenticated' },
                    500: { description: 'Server error' },
                },
            },
        },
        '/api/v1/restaurant': {
            get: {
                summary: 'Retrieve restaurant details',
                tags: ['Restaurant'],
                security: [{ bearerAuth: [] }],
                responses: {
                    200: {
                        description: 'Restaurant retrieved successfully',
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
                                                'Restaurant retrieved successfully',
                                        },
                                        data: {
                                            type: 'object',
                                            properties: {
                                                id: {
                                                    type: 'string',
                                                    example: '1234567890abcdef',
                                                },
                                                name: {
                                                    type: 'string',
                                                    example: 'The Gourmet Spot',
                                                },
                                                email: {
                                                    type: 'string',
                                                    example:
                                                        'owner@example.com',
                                                },
                                                address: {
                                                    type: 'object',
                                                    properties: {
                                                        street: {
                                                            type: 'string',
                                                            example:
                                                                '123 Culinary Blvd',
                                                        },
                                                        city: {
                                                            type: 'string',
                                                            example: 'Foodtown',
                                                        },
                                                        state: {
                                                            type: 'string',
                                                            example:
                                                                'Tasteville',
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
                    404: { description: 'Restaurant not found' },
                    401: { description: 'User not authenticated' },
                    500: { description: 'Server error' },
                },
            },
            put: {
                summary: 'Update restaurant details',
                tags: ['Restaurant'],
                security: [{ bearerAuth: [] }],
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    name: {
                                        type: 'string',
                                        example: 'The Updated Gourmet Spot',
                                    },
                                    street: {
                                        type: 'string',
                                        example: '456 Flavor Ave',
                                    },
                                    city: {
                                        type: 'string',
                                        example: 'Cuisine City',
                                    },
                                    state: {
                                        type: 'string',
                                        example: 'Deliciousland',
                                    },
                                },
                            },
                        },
                    },
                },
                responses: {
                    200: {
                        description: 'Restaurant data updated successfully',
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
                                                'Restaurant data updated successfully',
                                        },
                                        data: {
                                            type: 'object',
                                            properties: {
                                                id: {
                                                    type: 'string',
                                                    example: '1234567890abcdef',
                                                },
                                                name: {
                                                    type: 'string',
                                                    example:
                                                        'The Updated Gourmet Spot',
                                                },
                                                address: {
                                                    type: 'object',
                                                    properties: {
                                                        street: {
                                                            type: 'string',
                                                            example:
                                                                '456 Flavor Ave',
                                                        },
                                                        city: {
                                                            type: 'string',
                                                            example:
                                                                'Cuisine City',
                                                        },
                                                        state: {
                                                            type: 'string',
                                                            example:
                                                                'Deliciousland',
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
                    400: { description: 'Invalid input data' },
                    404: { description: 'Restaurant not found' },
                    500: { description: 'Server error' },
                },
            },
        },
        '/api/v1/restaurant/password/reset': {
            post: {
                summary: 'Change Restaurant Password',
                tags: ['Restaurant Profile'],
                security: [{ BearerAuth: [] }],
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    currentPassword: {
                                        type: 'string',
                                        example: 'oldpassword123',
                                    },
                                    newPassword: {
                                        type: 'string',
                                        example: 'newstrongpassword',
                                    },
                                },
                            },
                        },
                    },
                },
                responses: {
                    200: {
                        description: 'Password reset successfully',
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
                                                'Password reset successfully',
                                        },
                                    },
                                },
                            },
                        },
                    },
                    401: { description: 'Current password is incorrect' },
                    400: { description: 'Password has been used before' },
                    500: { description: 'Server error' },
                },
            },
        },
    },
};

export const allRestaurantDocs = {
    paths: {
        ...authRestaurantDocs.paths,
    },
};
