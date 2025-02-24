export const NotificationEventTypes = {
    // Auth related events
    USER_REGISTERED: 'user.registered',
    EMAIL_VERIFIED: 'user.email_verified',
    FORGET_PASSWORD: 'user.forget_password',
    OTP_SENT: 'user.verified_otp',
    PASSWORD_RESET: 'user.password_reset',

    // Order related events
    ORDER_CREATED: 'order:created',
    ORDER_UPDATED: 'order:updated',
    ORDER_DELIVERED: 'order:deleivred',

    // Restaurant related events
    RESTAURANT_ORDER_RECEIVED: 'restaurant:order_received',

    // Payment related events
    PAYMENT_SUCCESSFUL: 'payment:successful',
    PAYMENT_FAILED: 'payment:failed',
} as const;
