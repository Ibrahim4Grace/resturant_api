"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateOrderId = exports.generateOTP = void 0;
const otp_generator_1 = __importDefault(require("otp-generator"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const order_model_1 = __importDefault(require("@/resources/order/order-model"));
const generateOTP = async () => {
    const otp = otp_generator_1.default.generate(6, {
        lowerCaseAlphabets: false,
        upperCaseAlphabets: false,
        specialChars: false,
    });
    const hashedOTP = await bcryptjs_1.default.hash(otp, 10);
    return { otp, hashedOTP };
};
exports.generateOTP = generateOTP;
const generateOrderId = async () => {
    let isUnique = false;
    let order_number = '';
    while (!isUnique) {
        const otp = otp_generator_1.default.generate(8, {
            upperCaseAlphabets: false,
            lowerCaseAlphabets: false,
            specialChars: false,
        });
        order_number = `CR${otp}`;
        const existingOrder = await order_model_1.default.findOne({ order_number });
        if (!existingOrder) {
            isUnique = true;
        }
    }
    return order_number;
};
exports.generateOrderId = generateOrderId;
//# sourceMappingURL=otp-generator.js.map