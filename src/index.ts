import 'dotenv/config';
import 'module-alias/register';
import { config } from '@/config/index';
import App from './app';
import UserController from '@/resources/user/user-controller';
import AdminController from '@/resources/admin/admin-controller';
import RiderController from '@/resources/rider/rider-controller';
import RestaurantController from '@/resources/restaurant/controller';
import OrderController from '@/resources/order/order-controller';
import MenuController from '@/resources/menu/menu-controller';
import PaymentController from '@/resources/payment/payment-controller';

const app = new App(
    [
        new UserController(),
        new AdminController(),
        new OrderController(),
        new RiderController(),
        new RestaurantController(),
        new MenuController(),
        new PaymentController(),
    ],
    Number(config.PORT),
);

app.listen();
