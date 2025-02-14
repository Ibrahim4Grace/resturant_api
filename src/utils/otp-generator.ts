import otpGenerator from 'otp-generator';
import bcrypt from 'bcryptjs';
import OrderModel from '../resources/order/order-model';

export const generateOTP = async () => {
    const otp = otpGenerator.generate(6, {
        lowerCaseAlphabets: false,
        upperCaseAlphabets: false,
        specialChars: false,
    });
    const hashedOTP = await bcrypt.hash(otp, 10);
    return { otp, hashedOTP };
};

export const generateOrderId = async (): Promise<string> => {
    let isUnique = false;
    let order_number = '';

    while (!isUnique) {
        const otp = otpGenerator.generate(8, {
            upperCaseAlphabets: false,
            lowerCaseAlphabets: false,
            specialChars: false,
        });
        order_number = `CR${otp}`;

        const existingOrder = await OrderModel.findOne({ order_number });
        if (!existingOrder) {
            isUnique = true;
        }
    }

    return order_number;
};
