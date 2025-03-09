export const CACHE_KEYS = {
    // Admin-related keys
    ALL_ADMINS: 'all_admins',
    ADMIN_BY_ID: (id: string) => `admin:${id}`,
    ADMIN_RESTAURANT_ANALYTICS: 'admin:restaurant:analytics',
    ADMIN_ALL_MENUS: 'admin:all_menus',
    ADMIN_MENU_BY_ID: (menuId: string) => `admin:menu:${menuId}`,

    // User-related keys
    ALL_USERS: 'all_users',
    USER_BY_ID: (id: string) => `user:${id}`,
    USER_ADDRESSES: (userId: string) => `user:${userId}:addresses`,
    USER_ADDRESS_BY_ID: (userId: string, addressId: string) =>
        `user:${userId}:address:${addressId}`,
    USER_ORDERS: (userId: string) => `user:${userId}:orders`,
    USER_ORDER_BY_ID: (userId: string, orderId: string) =>
        `user:${userId}:order:${orderId}`,

    // Restaurant-related keys
    ALL_RESTAURANTS: 'all_restaurants',
    RESTAURANT_BY_ID: (id: string) => `restaurant:${id}`,
    RESTAURANT_DETAILS: (id: string) => `restaurant:${id}:details`,
    RESTAURANT_ANALYTICS: (id: string) => `restaurant:${id}:analytics`,
    ALL_RESTAURANT_ORDERS: (restaurantId: string) =>
        `restaurant:${restaurantId}:orders`,
    RESTAURANT_MENUS: (restaurantId: string) =>
        `restaurant:${restaurantId}:menus`,

    // Rider-related keys
    ALL_RIDERS: 'all_riders',
    RIDER_BY_ID: (id: string) => `rider:${id}`,
    RIDER_DELIVERY_BY_ID: (riderId: string, deliveryId: string) =>
        `rider:${riderId}:delivery:${deliveryId}`,

    // Order-related keys
    ALL_ORDERS: 'all_orders',
    ORDER_BY_ID: (id: string) => `order:${id}`,
    ALL_USER_ORDER: (restaurantId: string) => `all_user_order${restaurantId}`,

    // Menu-related keys
    ALL_MENUS: (restaurantId: string) => `all_menus_${restaurantId}`,
    MENU_BY_ID: (menuId: string, restaurantId: string) =>
        `menu_by_restaurant_${menuId}_${restaurantId}`,

    // Review-related keys
    ALL_REVIEWS: 'all_reviews',
    TARGET_REVIEWS: (targetType: string, targetId: string) =>
        `reviews:${targetType.toLowerCase()}:${targetId}`,
    USER_REVIEWS: (userId: string) => `user_reviews_${userId}`,

    WALLET_TRANSACTIONS_PREFIX: 'wallet_transactions',
} as const;
