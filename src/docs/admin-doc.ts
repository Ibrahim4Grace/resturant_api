export const authAdminDocs = {
    paths: {
        '/api/v1/auth/admin/register': {
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
        '/api/v1/auth/admin/verify-otp': {
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
        '/api/v1/auth/admin/forgot': {
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
        '/api/v1/auth/admin/password/verify-otp': {
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
        '/api/v1/auth/admin/password/reset': {
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
        '/api/v1/auth/admin/login': {
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
        '/api/v1/admin/profile': {
            get: {
                summary: 'Get Admin Profile',
                tags: ['Admin Profile'],
                security: [{ BearerAuth: [] }],
                responses: {
                    200: {
                        description: 'Profile retrieved successfully',
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
                                                'Profile retrieved successfully',
                                        },
                                        data: {
                                            type: 'object',
                                            properties: {
                                                _id: {
                                                    type: 'string',
                                                    example: '654321abcdef',
                                                },
                                                full_name: {
                                                    type: 'string',
                                                    example: 'John Doe',
                                                },
                                                email: {
                                                    type: 'string',
                                                    example:
                                                        'john.doe@example.com',
                                                },
                                                phone: {
                                                    type: 'string',
                                                    example: '+1234567890',
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
            put: {
                summary: 'Update Admin Profile',
                tags: ['Admin Profile'],
                security: [{ BearerAuth: [] }],
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    full_name: {
                                        type: 'string',
                                        example: 'John Doe',
                                    },
                                    email: {
                                        type: 'string',
                                        example: 'john.doe@example.com',
                                    },
                                    phone: {
                                        type: 'string',
                                        example: '+1234567890',
                                    },
                                },
                            },
                        },
                    },
                },
                responses: {
                    200: {
                        description: 'Profile data updated successfully',
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
                                                'Profile data updated successfully',
                                        },
                                    },
                                },
                            },
                        },
                    },
                    404: { description: 'Admin not found or update failed' },
                    500: { description: 'Server error' },
                },
            },
        },
        '/api/v1/admin/password/reset': {
            post: {
                summary: 'Change Admin Password',
                tags: ['Admin Profile'],
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
        '/api/v1/admin/{id}': {
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
                summary: 'Delete a admin by ID',
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
        '/api/v1/admin/users': {
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
        '/api/v1/admin/user/{id}': {
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
        '/api/v1/admin/user/{userId}/status': {
            patch: {
                summary: 'Update user account status',
                tags: ['Admin - Users'],
                security: [{ BearerAuth: [] }],
                parameters: [
                    {
                        name: 'userId',
                        in: 'path',
                        required: true,
                        schema: {
                            type: 'string',
                            example: '65f2c3b4a9e12d001b123456',
                        },
                        description:
                            'ID of the user whose status is being updated',
                    },
                ],
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    isLocked: {
                                        type: 'boolean',
                                        example: true,
                                        description:
                                            'Set to true to lock the account, false to unlock',
                                    },
                                },
                            },
                        },
                    },
                },
                responses: {
                    200: {
                        description: 'User account status updated successfully',
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
                                                'User account locked successfully',
                                        },
                                        data: {
                                            type: 'object',
                                            properties: {
                                                _id: {
                                                    type: 'string',
                                                    example:
                                                        '65f2c3b4a9e12d001b123456',
                                                },
                                                email: {
                                                    type: 'string',
                                                    example: 'user@example.com',
                                                },
                                                isLocked: {
                                                    type: 'boolean',
                                                    example: true,
                                                },
                                                updatedAt: {
                                                    type: 'string',
                                                    format: 'date-time',
                                                },
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },
                    400: { description: 'Invalid input data' },
                    401: {
                        description: 'Unauthorized - Admin access required',
                    },
                    404: { description: 'User not found' },
                    500: { description: 'Internal server error' },
                },
            },
        },
        '/api/v1/admin/restaurants': {
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
        '/api/v1/admin/restaurant/{restaurantId}/status': {
            patch: {
                summary: 'Update restaurant account status',
                tags: ['Admin - restaurant'],
                security: [{ BearerAuth: [] }],
                parameters: [
                    {
                        name: 'restaurantId',
                        in: 'path',
                        required: true,
                        schema: {
                            type: 'string',
                            example: '65f2c3b4a9e12d001b123456',
                        },
                        description:
                            'ID of the restaurant whose status is being updated',
                    },
                ],
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    isLocked: {
                                        type: 'string',
                                        status: 'active',
                                        description:
                                            'restaurant account activated',
                                    },
                                },
                            },
                        },
                    },
                },
                responses: {
                    200: {
                        description:
                            'restaurant account status updated successfully',
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
                                                'restaurant account locked successfully',
                                        },
                                        data: {
                                            type: 'object',
                                            properties: {
                                                _id: {
                                                    type: 'string',
                                                    example:
                                                        '65f2c3b4a9e12d001b123456',
                                                },
                                                email: {
                                                    type: 'string',
                                                    example: 'user@example.com',
                                                },
                                                status: {
                                                    type: 'string',
                                                    example: 'active',
                                                },
                                                updatedAt: {
                                                    type: 'string',
                                                    format: 'date-time',
                                                },
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },
                    400: { description: 'Invalid input data' },
                    401: {
                        description: 'Unauthorized - Admin access required',
                    },
                    404: { description: 'restaurant not found' },
                    500: { description: 'Internal server error' },
                },
            },
        },
        '/api/v1/admin/restaurant/stats': {
            get: {
                summary: 'Get restaurant analytics',
                tags: ['Admin - Restaurant Analytics'],
                security: [{ BearerAuth: [] }],
                responses: {
                    200: {
                        description:
                            'Restaurant analytics retrieved successfully',
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
                                                'Restaurant analytics retrieved successfully',
                                        },
                                        data: {
                                            type: 'object',
                                            properties: {
                                                totalOrders: {
                                                    type: 'number',
                                                    example: 500,
                                                },
                                                revenue: {
                                                    type: 'object',
                                                    properties: {
                                                        total: {
                                                            type: 'number',
                                                            example: 250000,
                                                        },
                                                        average: {
                                                            type: 'number',
                                                            example: 500,
                                                        },
                                                    },
                                                },
                                                ratings: {
                                                    type: 'object',
                                                    properties: {
                                                        total: {
                                                            type: 'number',
                                                            example: 1200,
                                                        },
                                                        average: {
                                                            type: 'number',
                                                            example: 4.5,
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
                        description: 'Forbidden - Insufficient permissions',
                    },
                    404: { description: 'Admin not found' },
                    500: { description: 'Server error' },
                },
            },
        },
        '/api/v1/admin/restaurant/{id}': {
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

        '/api/v1/admin/riders': {
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
        '/api/v1/admin/rider/{id}': {
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
        '/api/v1/admin/orders': {
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
        '/api/v1/admin/order/{id}': {
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

export const adminMenuDocs = {
    paths: {
        '/api/v1/admin/menus': {
            get: {
                summary: 'Fetch all menus',
                tags: ['Admin - Menus'],
                security: [{ BearerAuth: [] }],
                responses: {
                    200: {
                        description: 'Menus retrieved successfully',
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
                                            example: 'Menu retrieve successful',
                                        },
                                        data: {
                                            type: 'object',
                                            properties: {
                                                results: {
                                                    type: 'array',
                                                    items: {
                                                        $ref: '#/components/schemas/Menu',
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
                    500: { description: 'Server error' },
                },
            },
        },
        '/api/v1/admin/menu/{menuId}': {
            get: {
                summary: 'Fetch menu by ID',
                tags: ['Admin - Menus'],
                security: [{ BearerAuth: [] }],
                parameters: [
                    {
                        name: 'menuId',
                        in: 'path',
                        required: true,
                        schema: { type: 'string' },
                        description: 'The ID of the menu to retrieve',
                    },
                ],
                responses: {
                    200: {
                        description: 'Menu retrieved successfully',
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
                                                'Menu retrieve by ID successful',
                                        },
                                        data: {
                                            $ref: '#/components/schemas/Menu',
                                        },
                                    },
                                },
                            },
                        },
                    },
                    404: { description: 'Menu not found' },
                    500: { description: 'Server error' },
                },
            },
            delete: {
                summary: 'Delete a menu',
                tags: ['Admin - Menus'],
                security: [{ BearerAuth: [] }],
                parameters: [
                    {
                        name: 'menuId',
                        in: 'path',
                        required: true,
                        schema: { type: 'string' },
                        description: 'The ID of the menu to delete',
                    },
                ],
                responses: {
                    200: {
                        description: 'Menu deleted successfully',
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
                                                'Menu deleted successfully',
                                        },
                                    },
                                },
                            },
                        },
                    },
                    404: { description: 'Menu not found' },
                    500: { description: 'Server error' },
                },
            },
        },
        '/api/v1/admin/restaurant/{restaurantId}/menus': {
            get: {
                summary: 'Fetch menus for a specific restaurant',
                tags: ['Admin - Menus'],
                security: [{ BearerAuth: [] }],
                parameters: [
                    {
                        name: 'restaurantId',
                        in: 'path',
                        required: true,
                        schema: { type: 'string' },
                        description:
                            'The ID of the restaurant to retrieve menus for',
                    },
                ],
                responses: {
                    200: {
                        description: 'Restaurant menus retrieved successfully',
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
                                                'Restaurant menus retrieved successfully',
                                        },
                                        data: {
                                            type: 'object',
                                            properties: {
                                                results: {
                                                    type: 'array',
                                                    items: {
                                                        $ref: '#/components/schemas/Menu',
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
                    404: { description: 'Restaurant not found' },
                    500: { description: 'Server error' },
                },
            },
        },
    },
    components: {
        schemas: {
            Menu: {
                type: 'object',
                properties: {
                    id: { type: 'string', example: '65b3c1f23e4f2a001e4a2b1a' },
                    name: { type: 'string', example: 'Cheese Pizza' },
                    description: {
                        type: 'string',
                        example:
                            'Delicious cheese pizza with fresh ingredients',
                    },
                    price: { type: 'number', example: 12.99 },
                    restaurantId: {
                        type: 'string',
                        example: '65a1b2c3d4e5f67890123456',
                    },
                    createdAt: { type: 'string', format: 'date-time' },
                    updatedAt: { type: 'string', format: 'date-time' },
                },
            },
        },
    },
};

export const adminReviewDocs = {
    paths: {
        '/api/v1/admin/reviews': {
            get: {
                summary: 'Get paginated reviews',
                tags: ['Admin - Reviews'],
                security: [{ BearerAuth: [] }],
                responses: {
                    200: {
                        description: 'List of paginated reviews',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        results: {
                                            type: 'array',
                                            items: {
                                                $ref: '#/components/schemas/Review',
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
                    500: { description: 'Server error' },
                },
            },
        },
        '/api/v1/admin/review/{reviewId}': {
            get: {
                summary: 'Fetch a review by ID',
                tags: ['Admin - Reviews'],
                security: [{ BearerAuth: [] }],
                parameters: [
                    {
                        name: 'reviewId',
                        in: 'path',
                        required: true,
                        schema: { type: 'string' },
                        description: 'The ID of the review',
                    },
                ],
                responses: {
                    200: {
                        description: 'Review details',
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/Review' },
                            },
                        },
                    },
                    404: { description: 'Review not found' },
                    500: { description: 'Server error' },
                },
            },
            delete: {
                summary: 'Delete a review by ID',
                tags: ['Reviews'],
                parameters: [
                    {
                        name: 'reviewId',
                        in: 'path',
                        required: true,
                        schema: { type: 'string' },
                        description: 'The ID of the review to delete',
                    },
                ],
                responses: {
                    200: {
                        description: 'Review deleted successfully',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        message: {
                                            type: 'string',
                                            example:
                                                'Review deleted successfully',
                                        },
                                    },
                                },
                            },
                        },
                    },
                    404: { description: 'Review not found' },
                    500: { description: 'Server error' },
                },
            },
        },
    },
    components: {
        schemas: {
            Review: {
                type: 'object',
                properties: {
                    _id: {
                        type: 'string',
                        example: '60d5ec49f1a2c300154f8672',
                    },
                    user: {
                        type: 'string',
                        example: '60d5ec49f1a2c300154f1234',
                    },
                    rating: { type: 'number', example: 4.5 },
                    comment: { type: 'string', example: 'Great experience!' },
                    createdAt: { type: 'string', format: 'date-time' },
                },
            },
        },
    },
};

export const settingsDocs = {
    paths: {
        '/api/v1/admin/settings/fees': {
            get: {
                summary: 'Get all settings',
                tags: ['Admin - Settings'],
                security: [{ BearerAuth: [] }],
                responses: {
                    200: {
                        description: 'Settings retrieved successfully',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        tax_rate: {
                                            type: 'number',
                                            example: 0.1,
                                        },
                                        delivery_fee: {
                                            type: 'number',
                                            example: 5,
                                        },
                                        restaurant_commission: {
                                            type: 'number',
                                            example: 0.1,
                                        },
                                    },
                                },
                            },
                        },
                    },
                    404: { description: 'Settings not found' },
                    500: { description: 'Server error' },
                },
            },
        },
        '/api/v1/admin/settings': {
            put: {
                summary: 'Update settings',
                tags: ['Admin - Settings'],
                security: [{ BearerAuth: [] }],
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    tax_rate: { type: 'number', example: 0.1 },
                                    delivery_fee: {
                                        type: 'number',
                                        example: 5,
                                    },
                                    restaurant_commission: {
                                        type: 'number',
                                        example: 0.1,
                                    },
                                },
                            },
                        },
                    },
                },
                responses: {
                    200: {
                        description: 'Settings updated successfully',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        tax_rate: {
                                            type: 'number',
                                            example: 0.1,
                                        },
                                        delivery_fee: {
                                            type: 'number',
                                            example: 5,
                                        },
                                        restaurant_commission: {
                                            type: 'number',
                                            example: 0.1,
                                        },
                                    },
                                },
                            },
                        },
                    },
                    500: { description: 'Server error' },
                },
            },
            post: {
                summary: 'Create settings',
                tags: ['Admin - Settings'],
                security: [{ BearerAuth: [] }],
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    tax_rate: { type: 'number', example: 0.1 },
                                    delivery_fee: {
                                        type: 'number',
                                        example: 5,
                                    },
                                    restaurant_commission: {
                                        type: 'number',
                                        example: 0.1,
                                    },
                                },
                            },
                        },
                    },
                },
                responses: {
                    201: {
                        description: 'Settings created successfully',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        tax_rate: {
                                            type: 'number',
                                            example: 0.1,
                                        },
                                        delivery_fee: {
                                            type: 'number',
                                            example: 5,
                                        },
                                        restaurant_commission: {
                                            type: 'number',
                                            example: 0.1,
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
    },
};

export const allAdminDocs = {
    paths: {
        ...authAdminDocs.paths,
        ...adminDocs.paths,
        ...adminMenuDocs.paths,
        ...adminReviewDocs.paths,
        ...settingsDocs.paths,
    },
};
