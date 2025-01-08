import { EmailData } from "@/types/index";

export const sendOTPByEmail = (
    user: { name: string; email: string },
    otp: string,
): EmailData => {
    const otpExpiryHours = process.env.OTP_EXPIRY || 15;
    return {
        from: process.env.nodemailerEmail as string,
        to: user.email,
        subject: "Your 6-digit Verification Code",
        html: `  <p>Dear ${user.name}, </p>
          <p>Use the 6-digit Code provided below to verify your email:</p>
          <p>Your verification code is: <b>${otp}</b></p>
          <p>This code will expire in ${otpExpiryHours} hours.</p>
          <p>If you didn't register, please ignore this email.</p>
          <p>Best regards,<br> The Korex Team</p>`,
    };
};

export const PasswordResetEmail = (user: {
    name: string;
    email: string;
}): EmailData => {
    return {
        from: process.env.nodemailerEmail as string,
        to: user.email,
        subject: "Password Reset Confirmation",
        html: `
            <p>Hello ${user.name || "User"},</p>
            <p>Your password has been successfully reset. If you did not perform this action, please contact our support team immediately.</p>

            <p>Best regards,<br>
            The Korex Team</p>`,
    };
};
