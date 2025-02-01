import 'dotenv/config';
import 'module-alias/register';
import App from './app';
import validateEnv from '@/utils/validateEnv';
import UserController from '@/resources/user/user-controller';
import AdminController from '@/resources/admin/admin-controller';
import RiderController from '@/resources/rider/rider-controller';
import RestaurantController from '@/resources/restaurant/controller';
import OrderController from '@/resources/order/order-controller';
import MenuController from '@/resources/menu/menu-controller';

//to be sure we have all env files
validateEnv();

const app = new App(
    [
        new UserController(),
        new AdminController(),
        new OrderController(),
        new RiderController(),
        new RestaurantController(),
        new MenuController(),
    ],
    Number(process.env.PORT),
);

app.listen();
