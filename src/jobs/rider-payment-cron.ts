import cron from 'node-cron';
import { logger } from '../utils';
import SettingModel from '../resources/settings/setting-model';
import OrderModel from '../resources/order/order-model';
import { PaymentService } from '../resources/gateway/payment-service';
import { OrderService } from '../resources/order/order-service';
import { UserService } from '../resources/user/user-service';
import { WalletService } from '../resources/wallet/wallet-service';

// Instantiate without arguments
const orderService = new OrderService();
const userService = new UserService();
const walletService = new WalletService();
const paymentService = new PaymentService();

// Set dependencies after creation
paymentService.setServices(orderService, userService, walletService);

export const riderPaymentCron = () => {
    // Run every hour at the start of the hour (e.g., 1:00, 2:00, etc.)
    cron.schedule(
        '0 * * * *',
        async () => {
            try {
                logger.info('Checking for pending rider payments');

                const settings = await SettingModel.findOne();
                if (!settings) return;

                // Process payment after a delay period if no dispute raised
                const disputeWindowHours = settings.dispute_window_hours || 2;
                const cutoffTime = new Date();
                cutoffTime.setHours(cutoffTime.getHours() - disputeWindowHours);

                const pendingOrders = await OrderModel.find({
                    status: 'delivered',
                    delivery_confirmed: { $ne: true },
                    'delivery_info.estimatedDeliveryTime': { $lt: cutoffTime },
                    'delivery_info.riderId': { $exists: true },
                });

                logger.info(
                    `Found ${pendingOrders.length} orders with pending rider payments`,
                );

                let processedCount = 0;
                for (const order of pendingOrders) {
                    try {
                        await paymentService.processRiderPayment(order);
                        processedCount++;
                    } catch (error) {
                        logger.error(
                            `Failed to process rider payment for order #${order.order_number}:`,
                            error.message,
                        );
                    }
                }

                if (processedCount > 0) {
                    logger.info(
                        `Successfully processed ${processedCount} rider payments`,
                    );
                } else if (pendingOrders.length > 0) {
                    logger.warn(
                        `Failed to process any of the ${pendingOrders.length} pending rider payments`,
                    );
                }
            } catch (error) {
                logger.error(
                    'Error checking pending rider payments:',
                    error.message,
                );
            }
        },
        {
            scheduled: true,
            timezone: 'Africa/Lagos',
        },
    );

    logger.info('Rider payment cron job scheduled');
};
