"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
require("module-alias/register");
const index_1 = require("@/config/index");
const app_1 = __importDefault(require("./app"));
const user_controller_1 = __importDefault(require("@/resources/user/user-controller"));
const admin_controller_1 = __importDefault(require("@/resources/admin/admin-controller"));
const rider_controller_1 = __importDefault(require("@/resources/rider/rider-controller"));
const controller_1 = __importDefault(require("@/resources/restaurant/controller"));
const order_controller_1 = __importDefault(require("@/resources/order/order-controller"));
const menu_controller_1 = __importDefault(require("@/resources/menu/menu-controller"));
const payment_controller_1 = __importDefault(require("@/resources/payment/payment-controller"));
const app = new app_1.default([
    new user_controller_1.default(),
    new admin_controller_1.default(),
    new order_controller_1.default(),
    new rider_controller_1.default(),
    new controller_1.default(),
    new menu_controller_1.default(),
    new payment_controller_1.default(),
], Number(index_1.config.PORT));
app.listen();
//# sourceMappingURL=index.js.map