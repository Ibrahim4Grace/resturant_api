import otpGenerator from 'otp-generator';
import bcrypt from 'bcryptjs';
import OrderModel from '../resources/order/order-model';
import WalletModel from '../resources/wallet/wallet-model';

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

export const generateReference = async (): Promise<string> => {
    let isUnique = false;
    let reference = '';

    while (!isUnique) {
        const otp = otpGenerator.generate(8, {
            upperCaseAlphabets: false,
            lowerCaseAlphabets: false,
            specialChars: false,
        });
        reference = `ref${otp}`;

        const existingOrder = await WalletModel.findOne({ reference });
        if (!existingOrder) {
            isUnique = true;
        }
    }

    return reference;
};
