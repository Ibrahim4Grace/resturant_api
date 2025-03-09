import cron from 'node-cron';
import { log } from '../utils';
import SettingModel from '../resources/settings/setting-model';
import OrderModel from '../resources/order/order-model';
import { PaymentService } from '../resources/gateway/payment-service';
import { OrderService } from '../resources/order/order-service';
import { UserService } from '../resources/user/user-service';
import { WalletService } from '../resources/wallet/wallet-service';

const orderService = new OrderService(paymentService);
const userService = new UserService();
const walletService = new WalletService();
var paymentService = new PaymentService(
    orderService,
    userService,
    walletService,
);

export const setupRiderPaymentCron = () => {
    // Run every hour at the start of the hour (e.g., 1:00, 2:00, etc.)
    cron.schedule(
        '0 * * * *',
        async () => {
            try {
                log.info('Checking for pending rider payments');

                const settings = await SettingModel.findOne();
                if (!settings) {
                    log.warn('No settings found, skipping rider payment check');
                    return;
                }
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

                log.info(
                    `Found ${pendingOrders.length} orders with pending rider payments`,
                );

                for (const order of pendingOrders) {
                    await paymentService.processRiderPayment(order);
                }

                if (pendingOrders.length > 0) {
                    log.info(
                        `Processed ${pendingOrders.length} rider payments`,
                    );
                }
            } catch (error) {
                log.error('Error checking pending rider payments:', error);
            }
        },
        {
            scheduled: true,
            timezone: 'Africa/Lagos',
        },
    );

    log.info('Rider payment cron job scheduled');
};
