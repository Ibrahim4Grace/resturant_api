export const authRiderDocs = {
    paths: {
        '/api/v1/auth/rider/register': {
            post: {
                summary: 'Register a new user',
                tags: ['Authenticate - Riders'],
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
        '/api/v1/auth/rider/verify-otp': {
            post: {
                summary: 'Verify OTP for registration',
                tags: ['Authenticate - Riders'],
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
        '/api/v1/auth/rider/forgot': {
            post: {
                summary: 'Request password reset',
                tags: ['Authenticate - Riders'],
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
        '/api/v1/auth/rider/password/verify-otp': {
            post: {
                summary: 'Verify OTP for password reset',
                tags: ['Authenticate - Riders'],
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
        '/api/v1/auth/rider/password/reset': {
            post: {
                summary: 'Reset password using reset token and OTP',
                tags: ['Authenticate - Riders'],
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
        '/api/v1/auth/rider/login': {
            post: {
                summary: 'Login with email and password',
                tags: ['Authenticate - Riders'],
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
export const riderDocs = {
    paths: {
        '/api/v1/rider/profile': {
            get: {
                summary: 'Retrieve rider profile',
                tags: ['Rider'],
                security: [{ BearerAuth: [] }],
                responses: {
                    200: {
                        description: 'Rider profile retrieved successfully',
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
                                                'Rider retrieved successfully',
                                        },
                                        data: {
                                            type: 'object',
                                            properties: {
                                                _id: {
                                                    type: 'string',
                                                    example:
                                                        '64ab12ef34bc56d78f9a01cd',
                                                },
                                                name: {
                                                    type: 'string',
                                                    example: 'John Doe',
                                                },
                                                email: {
                                                    type: 'string',
                                                    example:
                                                        'rider@example.com',
                                                },
                                                status: {
                                                    type: 'string',
                                                    example: 'available',
                                                },
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },
                    404: { description: 'Rider not found' },
                },
            },
            put: {
                summary: 'Update rider profile',
                tags: ['Rider'],
                security: [{ BearerAuth: [] }],
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
                                        example: 'rider@example.com',
                                    },
                                },
                            },
                        },
                    },
                },
                responses: {
                    200: { description: 'Rider data updated successfully' },
                    404: { description: 'Rider not found' },
                },
            },
        },
        '/api/v1/rider/password/reset': {
            post: {
                summary: 'Change Rider Password',
                tags: ['Rider Profile'],
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

        '/api/v1/rider/orders/ready-for-pickup': {
            get: {
                summary: 'Get orders ready for pickup',
                tags: ['Rider'],
                security: [{ BearerAuth: [] }],
                responses: {
                    200: {
                        description:
                            'List of ready-for-pickup orders retrieved successfully',
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
                                                'Ready for pickup orders retrieved successfully',
                                        },
                                        data: {
                                            type: 'array',
                                            items: {
                                                type: 'object',
                                                properties: {
                                                    _id: {
                                                        type: 'string',
                                                        example:
                                                            '65ab12ef34bc56d78f9a01cd',
                                                    },
                                                    status: {
                                                        type: 'string',
                                                        example:
                                                            'ready_for_pickup',
                                                    },
                                                    restaurant: {
                                                        type: 'string',
                                                        example: 'Pizza Palace',
                                                    },
                                                },
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },
                    404: { description: 'No orders found' },
                },
            },
        },

        '/api/v1/rider/orders/{orderId}/pickup': {
            post: {
                summary: 'Claim an order for pickup',
                tags: ['Rider'],
                security: [{ BearerAuth: [] }],
                parameters: [
                    {
                        name: 'orderId',
                        in: 'path',
                        required: true,
                        schema: { type: 'string' },
                        example: '65ab12ef34bc56d78f9a01cd',
                    },
                ],
                responses: {
                    200: {
                        description: 'Order claimed successfully',
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
                                                'Order successfully claimed',
                                        },
                                    },
                                },
                            },
                        },
                    },
                    404: { description: 'Order not found' },
                    400: {
                        description:
                            'Rider is not available or order is not ready',
                    },
                },
            },
        },

        '/api/v1/rider/delivery/{orderId}/status': {
            put: {
                summary: 'Update order delivery status',
                tags: ['Rider'],
                security: [{ BearerAuth: [] }],
                parameters: [
                    {
                        name: 'orderId',
                        in: 'path',
                        required: true,
                        schema: { type: 'string' },
                        example: '65ab12ef34bc56d78f9a01cd',
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
                                        enum: ['shipped', 'delivered'],
                                    },
                                },
                            },
                        },
                    },
                },
                responses: {
                    200: { description: 'Order status updated successfully' },
                    400: { description: 'Invalid status update' },
                    404: { description: 'Order not found' },
                },
            },
        },

        '/api/v1/rider/deliveries': {
            get: {
                summary: 'Get rider deliveries',
                tags: ['Rider'],
                security: [{ BearerAuth: [] }],
                responses: {
                    200: {
                        description:
                            'List of deliveries retrieved successfully',
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
                                                'Deliveries retrieved successfully',
                                        },
                                        data: {
                                            type: 'array',
                                            items: {
                                                type: 'object',
                                                properties: {
                                                    _id: {
                                                        type: 'string',
                                                        example:
                                                            '65ab12ef34bc56d78f9a01cd',
                                                    },
                                                    status: {
                                                        type: 'string',
                                                        example: 'delivered',
                                                    },
                                                    restaurant: {
                                                        type: 'string',
                                                        example: 'Pizza Palace',
                                                    },
                                                },
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },
                    404: { description: 'No deliveries found' },
                },
            },
        },

        '/api/v1/rider/deliveries/{deliveryId}': {
            get: {
                summary: 'Get delivery details by ID',
                tags: ['Rider'],
                security: [{ BearerAuth: [] }],
                parameters: [
                    {
                        name: 'deliveryId',
                        in: 'path',
                        required: true,
                        schema: { type: 'string' },
                        example: '65ab12ef34bc56d78f9a01cd',
                    },
                ],
                responses: {
                    200: {
                        description: 'Delivery details retrieved successfully',
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
                                                'Delivery retrieved successfully',
                                        },
                                        data: {
                                            type: 'object',
                                            properties: {
                                                _id: {
                                                    type: 'string',
                                                    example:
                                                        '65ab12ef34bc56d78f9a01cd',
                                                },
                                                status: {
                                                    type: 'string',
                                                    example: 'delivered',
                                                },
                                                restaurant: {
                                                    type: 'string',
                                                    example: 'Pizza Palace',
                                                },
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },
                    404: { description: 'Delivery not found' },
                },
            },
        },
    },
};

export const allRiderDocs = {
    paths: {
        ...authRiderDocs.paths,
        ...riderDocs.paths,
    },
};
