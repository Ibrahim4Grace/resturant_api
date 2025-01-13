export const authUserDocs = {
    paths: {
        "/api/v1/auth/users/register": {
            post: {
                summary: "Register a new user",
                tags: ["Authentication"],
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                properties: {
                                    name: {
                                        type: "string",
                                        example: "John Doe",
                                    },
                                    email: {
                                        type: "string",
                                        example: "john.doe@example.com",
                                    },
                                    password: {
                                        type: "string",
                                        example: "strongpassword123",
                                    },
                                },
                            },
                        },
                    },
                },
                responses: {
                    201: {
                        description:
                            "Registration successful. Please verify your email with the OTP sent.",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        status: {
                                            type: "number",
                                            example: 201,
                                        },
                                        message: {
                                            type: "string",
                                            example:
                                                "Registration initiated. Please verify your email with the OTP sent.",
                                        },
                                        user: {
                                            type: "object",
                                            properties: {
                                                name: {
                                                    type: "string",
                                                    example: "John Doe",
                                                },
                                                email: {
                                                    type: "string",
                                                    example:
                                                        "john.doe@example.com",
                                                },
                                                isEmailVerified: {
                                                    type: "boolean",
                                                    example: false,
                                                },
                                            },
                                        },
                                        verificationToken: {
                                            type: "string",
                                            example: "jwt-verification-token",
                                        },
                                    },
                                },
                            },
                        },
                    },
                    409: { description: "Email already registered" },
                    500: { description: "Server error" },
                },
            },
        },
        "/api/v1/auth/users/verify-otp": {
            post: {
                summary: "Verify OTP for registration",
                tags: ["Authentication"],
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                properties: {
                                    otp: { type: "string", example: "123456" },
                                },
                            },
                        },
                    },
                },
                responses: {
                    200: {
                        description:
                            "Email verified successfully. You can now log in.",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        status: {
                                            type: "number",
                                            example: 200,
                                        },
                                        message: {
                                            type: "string",
                                            example:
                                                "Email verified successfully. You can now log in.",
                                        },
                                    },
                                },
                            },
                        },
                    },
                    400: {
                        description: "Invalid or expired verification session",
                    },
                    500: { description: "Server error" },
                },
            },
        },
        "/api/v1/auth/users/forgot": {
            post: {
                summary: "Request password reset",
                tags: ["Authentication"],
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                properties: {
                                    email: {
                                        type: "string",
                                        example: "john.doe@example.com",
                                    },
                                },
                            },
                        },
                    },
                },
                responses: {
                    200: {
                        description:
                            "Reset token generated and OTP sent to your email.",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        status: {
                                            type: "number",
                                            example: 200,
                                        },
                                        message: {
                                            type: "string",
                                            example:
                                                "Reset token generated and OTP sent to your email.",
                                        },
                                        resetToken: {
                                            type: "string",
                                            example: "jwt-reset-token",
                                        },
                                    },
                                },
                            },
                        },
                    },
                    404: { description: "User not found" },
                    500: { description: "Server error" },
                },
            },
        },
        "/api/v1/auth/users/password/verify-otp": {
            post: {
                summary: "Verify OTP for password reset",
                tags: ["Authentication"],
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                properties: {
                                    otp: { type: "string", example: "654321" },
                                },
                            },
                        },
                    },
                },
                responses: {
                    200: {
                        description:
                            "OTP verified successfully. You can now reset your password.",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        status: {
                                            type: "number",
                                            example: 200,
                                        },
                                        message: {
                                            type: "string",
                                            example:
                                                "OTP verified successfully. You can now reset your password.",
                                        },
                                    },
                                },
                            },
                        },
                    },
                    400: { description: "Invalid or expired reset token" },
                    500: { description: "Server error" },
                },
            },
        },
        "/api/v1/auth/users/password/reset": {
            post: {
                summary: "Reset password using reset token and OTP",
                tags: ["Authentication"],
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                properties: {
                                    newPassword: {
                                        type: "string",
                                        example: "newstrongpassword123",
                                    },
                                },
                            },
                        },
                    },
                },
                responses: {
                    200: {
                        description: "Password reset successfully.",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        status: {
                                            type: "number",
                                            example: 200,
                                        },
                                        message: {
                                            type: "string",
                                            example:
                                                "Password reset successfully.",
                                        },
                                    },
                                },
                            },
                        },
                    },
                    400: { description: "Invalid or expired reset token" },
                    500: { description: "Server error" },
                },
            },
        },
        "/api/v1/auth/users/login": {
            post: {
                summary: "Login with email and password",
                tags: ["Authentication"],
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                properties: {
                                    email: {
                                        type: "string",
                                        example: "john.doe@example.com",
                                    },
                                    password: {
                                        type: "string",
                                        example: "strongpassword123",
                                    },
                                },
                            },
                        },
                    },
                },
                responses: {
                    200: {
                        description: "Login successful.",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        status: {
                                            type: "number",
                                            example: 200,
                                        },
                                        message: {
                                            type: "string",
                                            example: "Login successful.",
                                        },
                                        user: {
                                            type: "object",
                                            properties: {
                                                name: {
                                                    type: "string",
                                                    example: "John Doe",
                                                },
                                                email: {
                                                    type: "string",
                                                    example:
                                                        "john.doe@example.com",
                                                },
                                                isEmailVerified: {
                                                    type: "boolean",
                                                    example: true,
                                                },
                                            },
                                        },
                                        token: {
                                            type: "string",
                                            example: "jwt-auth-token",
                                        },
                                    },
                                },
                            },
                        },
                    },
                    401: { description: "Invalid email or password" },
                    403: { description: "Email not verified" },
                    500: { description: "Server error" },
                },
            },
        },
    },
};

export const authAdminDocs = {
    paths: {
        "/api/v1/auth/admins/register": {
            post: {
                summary: "Register a new user",
                tags: ["Authentication"],
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                properties: {
                                    name: {
                                        type: "string",
                                        example: "John Doe",
                                    },
                                    email: {
                                        type: "string",
                                        example: "john.doe@example.com",
                                    },
                                    password: {
                                        type: "string",
                                        example: "strongpassword123",
                                    },
                                },
                            },
                        },
                    },
                },
                responses: {
                    201: {
                        description:
                            "Registration successful. Please verify your email with the OTP sent.",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        status: {
                                            type: "number",
                                            example: 201,
                                        },
                                        message: {
                                            type: "string",
                                            example:
                                                "Registration initiated. Please verify your email with the OTP sent.",
                                        },
                                        user: {
                                            type: "object",
                                            properties: {
                                                name: {
                                                    type: "string",
                                                    example: "John Doe",
                                                },
                                                email: {
                                                    type: "string",
                                                    example:
                                                        "john.doe@example.com",
                                                },
                                                isEmailVerified: {
                                                    type: "boolean",
                                                    example: false,
                                                },
                                            },
                                        },
                                        verificationToken: {
                                            type: "string",
                                            example: "jwt-verification-token",
                                        },
                                    },
                                },
                            },
                        },
                    },
                    409: { description: "Email already registered" },
                    500: { description: "Server error" },
                },
            },
        },
        "/api/v1/auth/admins/verify-otp": {
            post: {
                summary: "Verify OTP for registration",
                tags: ["Authentication"],
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                properties: {
                                    otp: { type: "string", example: "123456" },
                                },
                            },
                        },
                    },
                },
                responses: {
                    200: {
                        description:
                            "Email verified successfully. You can now log in.",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        status: {
                                            type: "number",
                                            example: 200,
                                        },
                                        message: {
                                            type: "string",
                                            example:
                                                "Email verified successfully. You can now log in.",
                                        },
                                    },
                                },
                            },
                        },
                    },
                    400: {
                        description: "Invalid or expired verification session",
                    },
                    500: { description: "Server error" },
                },
            },
        },
        "/api/v1/auth/admins/forgot": {
            post: {
                summary: "Request password reset",
                tags: ["Authentication"],
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                properties: {
                                    email: {
                                        type: "string",
                                        example: "john.doe@example.com",
                                    },
                                },
                            },
                        },
                    },
                },
                responses: {
                    200: {
                        description:
                            "Reset token generated and OTP sent to your email.",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        status: {
                                            type: "number",
                                            example: 200,
                                        },
                                        message: {
                                            type: "string",
                                            example:
                                                "Reset token generated and OTP sent to your email.",
                                        },
                                        resetToken: {
                                            type: "string",
                                            example: "jwt-reset-token",
                                        },
                                    },
                                },
                            },
                        },
                    },
                    404: { description: "User not found" },
                    500: { description: "Server error" },
                },
            },
        },
        "/api/v1/auth/admins/password/verify-otp": {
            post: {
                summary: "Verify OTP for password reset",
                tags: ["Authentication"],
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                properties: {
                                    otp: { type: "string", example: "654321" },
                                },
                            },
                        },
                    },
                },
                responses: {
                    200: {
                        description:
                            "OTP verified successfully. You can now reset your password.",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        status: {
                                            type: "number",
                                            example: 200,
                                        },
                                        message: {
                                            type: "string",
                                            example:
                                                "OTP verified successfully. You can now reset your password.",
                                        },
                                    },
                                },
                            },
                        },
                    },
                    400: { description: "Invalid or expired reset token" },
                    500: { description: "Server error" },
                },
            },
        },
        "/api/v1/auth/admins/password/reset": {
            post: {
                summary: "Reset password using reset token and OTP",
                tags: ["Authentication"],
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                properties: {
                                    newPassword: {
                                        type: "string",
                                        example: "newstrongpassword123",
                                    },
                                },
                            },
                        },
                    },
                },
                responses: {
                    200: {
                        description: "Password reset successfully.",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        status: {
                                            type: "number",
                                            example: 200,
                                        },
                                        message: {
                                            type: "string",
                                            example:
                                                "Password reset successfully.",
                                        },
                                    },
                                },
                            },
                        },
                    },
                    400: { description: "Invalid or expired reset token" },
                    500: { description: "Server error" },
                },
            },
        },
        "/api/v1/auth/admins/login": {
            post: {
                summary: "Login with email and password",
                tags: ["Authentication"],
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                properties: {
                                    email: {
                                        type: "string",
                                        example: "john.doe@example.com",
                                    },
                                    password: {
                                        type: "string",
                                        example: "strongpassword123",
                                    },
                                },
                            },
                        },
                    },
                },
                responses: {
                    200: {
                        description: "Login successful.",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        status: {
                                            type: "number",
                                            example: 200,
                                        },
                                        message: {
                                            type: "string",
                                            example: "Login successful.",
                                        },
                                        user: {
                                            type: "object",
                                            properties: {
                                                name: {
                                                    type: "string",
                                                    example: "John Doe",
                                                },
                                                email: {
                                                    type: "string",
                                                    example:
                                                        "john.doe@example.com",
                                                },
                                                isEmailVerified: {
                                                    type: "boolean",
                                                    example: true,
                                                },
                                            },
                                        },
                                        token: {
                                            type: "string",
                                            example: "jwt-auth-token",
                                        },
                                    },
                                },
                            },
                        },
                    },
                    401: { description: "Invalid email or password" },
                    403: { description: "Email not verified" },
                    500: { description: "Server error" },
                },
            },
        },
    },
};

export const authRiderDocs = {
    paths: {
        "/api/v1/auth/riders/register": {
            post: {
                summary: "Register a new user",
                tags: ["Authentication"],
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                properties: {
                                    name: {
                                        type: "string",
                                        example: "John Doe",
                                    },
                                    email: {
                                        type: "string",
                                        example: "john.doe@example.com",
                                    },
                                    password: {
                                        type: "string",
                                        example: "strongpassword123",
                                    },
                                },
                            },
                        },
                    },
                },
                responses: {
                    201: {
                        description:
                            "Registration successful. Please verify your email with the OTP sent.",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        status: {
                                            type: "number",
                                            example: 201,
                                        },
                                        message: {
                                            type: "string",
                                            example:
                                                "Registration initiated. Please verify your email with the OTP sent.",
                                        },
                                        user: {
                                            type: "object",
                                            properties: {
                                                name: {
                                                    type: "string",
                                                    example: "John Doe",
                                                },
                                                email: {
                                                    type: "string",
                                                    example:
                                                        "john.doe@example.com",
                                                },
                                                isEmailVerified: {
                                                    type: "boolean",
                                                    example: false,
                                                },
                                            },
                                        },
                                        verificationToken: {
                                            type: "string",
                                            example: "jwt-verification-token",
                                        },
                                    },
                                },
                            },
                        },
                    },
                    409: { description: "Email already registered" },
                    500: { description: "Server error" },
                },
            },
        },
        "/api/v1/auth/riders/verify-otp": {
            post: {
                summary: "Verify OTP for registration",
                tags: ["Authentication"],
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                properties: {
                                    otp: { type: "string", example: "123456" },
                                },
                            },
                        },
                    },
                },
                responses: {
                    200: {
                        description:
                            "Email verified successfully. You can now log in.",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        status: {
                                            type: "number",
                                            example: 200,
                                        },
                                        message: {
                                            type: "string",
                                            example:
                                                "Email verified successfully. You can now log in.",
                                        },
                                    },
                                },
                            },
                        },
                    },
                    400: {
                        description: "Invalid or expired verification session",
                    },
                    500: { description: "Server error" },
                },
            },
        },
        "/api/v1/auth/riders/forgot": {
            post: {
                summary: "Request password reset",
                tags: ["Authentication"],
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                properties: {
                                    email: {
                                        type: "string",
                                        example: "john.doe@example.com",
                                    },
                                },
                            },
                        },
                    },
                },
                responses: {
                    200: {
                        description:
                            "Reset token generated and OTP sent to your email.",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        status: {
                                            type: "number",
                                            example: 200,
                                        },
                                        message: {
                                            type: "string",
                                            example:
                                                "Reset token generated and OTP sent to your email.",
                                        },
                                        resetToken: {
                                            type: "string",
                                            example: "jwt-reset-token",
                                        },
                                    },
                                },
                            },
                        },
                    },
                    404: { description: "User not found" },
                    500: { description: "Server error" },
                },
            },
        },
        "/api/v1/auth/riders/password/verify-otp": {
            post: {
                summary: "Verify OTP for password reset",
                tags: ["Authentication"],
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                properties: {
                                    otp: { type: "string", example: "654321" },
                                },
                            },
                        },
                    },
                },
                responses: {
                    200: {
                        description:
                            "OTP verified successfully. You can now reset your password.",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        status: {
                                            type: "number",
                                            example: 200,
                                        },
                                        message: {
                                            type: "string",
                                            example:
                                                "OTP verified successfully. You can now reset your password.",
                                        },
                                    },
                                },
                            },
                        },
                    },
                    400: { description: "Invalid or expired reset token" },
                    500: { description: "Server error" },
                },
            },
        },
        "/api/v1/auth/riders/password/reset": {
            post: {
                summary: "Reset password using reset token and OTP",
                tags: ["Authentication"],
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                properties: {
                                    newPassword: {
                                        type: "string",
                                        example: "newstrongpassword123",
                                    },
                                },
                            },
                        },
                    },
                },
                responses: {
                    200: {
                        description: "Password reset successfully.",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        status: {
                                            type: "number",
                                            example: 200,
                                        },
                                        message: {
                                            type: "string",
                                            example:
                                                "Password reset successfully.",
                                        },
                                    },
                                },
                            },
                        },
                    },
                    400: { description: "Invalid or expired reset token" },
                    500: { description: "Server error" },
                },
            },
        },
        "/api/v1/auth/riders/login": {
            post: {
                summary: "Login with email and password",
                tags: ["Authentication"],
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                properties: {
                                    email: {
                                        type: "string",
                                        example: "john.doe@example.com",
                                    },
                                    password: {
                                        type: "string",
                                        example: "strongpassword123",
                                    },
                                },
                            },
                        },
                    },
                },
                responses: {
                    200: {
                        description: "Login successful.",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        status: {
                                            type: "number",
                                            example: 200,
                                        },
                                        message: {
                                            type: "string",
                                            example: "Login successful.",
                                        },
                                        user: {
                                            type: "object",
                                            properties: {
                                                name: {
                                                    type: "string",
                                                    example: "John Doe",
                                                },
                                                email: {
                                                    type: "string",
                                                    example:
                                                        "john.doe@example.com",
                                                },
                                                isEmailVerified: {
                                                    type: "boolean",
                                                    example: true,
                                                },
                                            },
                                        },
                                        token: {
                                            type: "string",
                                            example: "jwt-auth-token",
                                        },
                                    },
                                },
                            },
                        },
                    },
                    401: { description: "Invalid email or password" },
                    403: { description: "Email not verified" },
                    500: { description: "Server error" },
                },
            },
        },
    },
};

export const authRestaurantDocs = {
    paths: {
        "/api/v1/auth/restaurants/register": {
            post: {
                summary: "Register a new restaurant",
                tags: ["Authentication"],
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                properties: {
                                    name: {
                                        type: "string",
                                        example: "John Doe",
                                    },
                                    email: {
                                        type: "string",
                                        example: "john.doe@example.com",
                                    },
                                    password: {
                                        type: "string",
                                        example: "strongpassword123",
                                    },
                                },
                            },
                        },
                    },
                },
                responses: {
                    201: {
                        description:
                            "Registration successful. Please verify your email with the OTP sent.",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        status: {
                                            type: "number",
                                            example: 201,
                                        },
                                        message: {
                                            type: "string",
                                            example:
                                                "Registration initiated. Please verify your email with the OTP sent.",
                                        },
                                        user: {
                                            type: "object",
                                            properties: {
                                                name: {
                                                    type: "string",
                                                    example: "John Doe",
                                                },
                                                email: {
                                                    type: "string",
                                                    example:
                                                        "john.doe@example.com",
                                                },
                                                isEmailVerified: {
                                                    type: "boolean",
                                                    example: false,
                                                },
                                            },
                                        },
                                        verificationToken: {
                                            type: "string",
                                            example: "jwt-verification-token",
                                        },
                                    },
                                },
                            },
                        },
                    },
                    409: { description: "Email already registered" },
                    500: { description: "Server error" },
                },
            },
        },
        "/api/v1/auth/restaurants/verify-otp": {
            post: {
                summary: "Verify OTP for registration",
                tags: ["Authentication"],
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                properties: {
                                    otp: { type: "string", example: "123456" },
                                },
                            },
                        },
                    },
                },
                responses: {
                    200: {
                        description:
                            "Email verified successfully. You can now log in.",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        status: {
                                            type: "number",
                                            example: 200,
                                        },
                                        message: {
                                            type: "string",
                                            example:
                                                "Email verified successfully. You can now log in.",
                                        },
                                    },
                                },
                            },
                        },
                    },
                    400: {
                        description: "Invalid or expired verification session",
                    },
                    500: { description: "Server error" },
                },
            },
        },
        "/api/v1/auth/restaurants/forgot": {
            post: {
                summary: "Request password reset",
                tags: ["Authentication"],
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                properties: {
                                    email: {
                                        type: "string",
                                        example: "john.doe@example.com",
                                    },
                                },
                            },
                        },
                    },
                },
                responses: {
                    200: {
                        description:
                            "Reset token generated and OTP sent to your email.",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        status: {
                                            type: "number",
                                            example: 200,
                                        },
                                        message: {
                                            type: "string",
                                            example:
                                                "Reset token generated and OTP sent to your email.",
                                        },
                                        resetToken: {
                                            type: "string",
                                            example: "jwt-reset-token",
                                        },
                                    },
                                },
                            },
                        },
                    },
                    404: { description: "User not found" },
                    500: { description: "Server error" },
                },
            },
        },
        "/api/v1/auth/restaurants/password/verify-otp": {
            post: {
                summary: "Verify OTP for password reset",
                tags: ["Authentication"],
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                properties: {
                                    otp: { type: "string", example: "654321" },
                                },
                            },
                        },
                    },
                },
                responses: {
                    200: {
                        description:
                            "OTP verified successfully. You can now reset your password.",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        status: {
                                            type: "number",
                                            example: 200,
                                        },
                                        message: {
                                            type: "string",
                                            example:
                                                "OTP verified successfully. You can now reset your password.",
                                        },
                                    },
                                },
                            },
                        },
                    },
                    400: { description: "Invalid or expired reset token" },
                    500: { description: "Server error" },
                },
            },
        },
        "/api/v1/auth/restaurants/password/reset": {
            post: {
                summary: "Reset password using reset token and OTP",
                tags: ["Authentication"],
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                properties: {
                                    newPassword: {
                                        type: "string",
                                        example: "newstrongpassword123",
                                    },
                                },
                            },
                        },
                    },
                },
                responses: {
                    200: {
                        description: "Password reset successfully.",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        status: {
                                            type: "number",
                                            example: 200,
                                        },
                                        message: {
                                            type: "string",
                                            example:
                                                "Password reset successfully.",
                                        },
                                    },
                                },
                            },
                        },
                    },
                    400: { description: "Invalid or expired reset token" },
                    500: { description: "Server error" },
                },
            },
        },
        "/api/v1/auth/restaurants/login": {
            post: {
                summary: "Login with email and password",
                tags: ["Authentication"],
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                properties: {
                                    email: {
                                        type: "string",
                                        example: "john.doe@example.com",
                                    },
                                    password: {
                                        type: "string",
                                        example: "strongpassword123",
                                    },
                                },
                            },
                        },
                    },
                },
                responses: {
                    200: {
                        description: "Login successful.",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        status: {
                                            type: "number",
                                            example: 200,
                                        },
                                        message: {
                                            type: "string",
                                            example: "Login successful.",
                                        },
                                        user: {
                                            type: "object",
                                            properties: {
                                                name: {
                                                    type: "string",
                                                    example: "John Doe",
                                                },
                                                email: {
                                                    type: "string",
                                                    example:
                                                        "john.doe@example.com",
                                                },
                                                isEmailVerified: {
                                                    type: "boolean",
                                                    example: true,
                                                },
                                            },
                                        },
                                        token: {
                                            type: "string",
                                            example: "jwt-auth-token",
                                        },
                                    },
                                },
                            },
                        },
                    },
                    401: { description: "Invalid email or password" },
                    403: { description: "Email not verified" },
                    500: { description: "Server error" },
                },
            },
        },
    },
};

export const allAuthDocs = {
    paths: {
        ...authUserDocs.paths,
        ...authAdminDocs.paths,
        ...authRiderDocs.paths,
        ...authRestaurantDocs.paths,
    },
};
