import otpGenerator from 'otp-generator';
import bcrypt from 'bcryptjs';
import OrderModel from '@/resources/order/order-model';

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
    let orderId = '';

    while (!isUnique) {
        const otp = otpGenerator.generate(8, {
            upperCaseAlphabets: false,
            lowerCaseAlphabets: false,
            specialChars: false,
        });
        orderId = `CR${otp}`;

        const existingOrder = await OrderModel.findOne({ orderId });
        if (!existingOrder) {
            isUnique = true;
        }
    }

    return orderId;
};
