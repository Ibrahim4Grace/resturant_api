import otpGenerator from "otp-generator";
import bcrypt from "bcryptjs";

export const generateOTP = async () => {
    const otp = otpGenerator.generate(6, {
        lowerCaseAlphabets: false,
        upperCaseAlphabets: false,
        specialChars: false,
    });
    const hashedOTP = await bcrypt.hash(otp, 10);
    return { otp, hashedOTP };
};
