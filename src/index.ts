import 'dotenv/config';
import { config } from '../src/config/index';
import App from './app';
import UserController from '../src/resources/user/user-controller';
import AdminController from '../src/resources/admin/admin-controller';
import RiderController from '../src/resources/rider/rider-controller';
import RestaurantController from '../src/resources/restaurant/restaurant-controller';
import OrderController from '../src/resources/order/order-controller';
import MenuController from '../src/resources/menu/menu-controller';
import PaymentController from '../src/resources/payment/payment-controller';
import ReviewController from '../src/resources/review/review-controller';
import SettingsController from '../src/resources/settings/setting-controller';

const app = new App(
    [
        new UserController(),
        new AdminController(),
        new OrderController(),
        new RiderController(),
        new RestaurantController(),
        new MenuController(),
        new PaymentController(),
        new ReviewController(),
        new SettingsController(),
    ],
    Number(config.PORT),
);

app.listen();
