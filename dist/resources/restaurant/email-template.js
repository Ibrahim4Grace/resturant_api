"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PasswordResetEmail = exports.pendingVerificationEmail = exports.sendOTPByEmail = void 0;
const supportEmail = process.env.SUPPORT_EMAIL;
const supportPhone = process.env.SUPPORT_PHONE;
const sendOTPByEmail = (restaurant, otp) => {
    const otpExpiryMillis = Number(process.env.OTP_EXPIRY);
    const otpExpiryHour = otpExpiryMillis / (60 * 60 * 1000);
    return {
        from: process.env.nodemailerEmail,
        to: restaurant.email,
        subject: 'Your 6-digit Verification Code',
        html: `  <p>Dear ${restaurant.name}, </p>
          <p>Use the 6-digit Code provided below to verify your email:</p>
          <p>Your verification code is: <b>${otp}</b></p>
       <p>This code will expire in ${otpExpiryHour} hour.</p>
          <p>If you didn't register, please ignore this email.</p>
           <p>Best regards,<br>The Chef-kay restaurant Team</p>`,
    };
};
exports.sendOTPByEmail = sendOTPByEmail;
const pendingVerificationEmail = (restaurant) => {
    return {
        from: process.env.nodemailerEmail,
        to: restaurant.email,
        subject: 'Account Pending Verification',
        html: `  <p>Dear ${restaurant.name}, </p>
           
        <p>Thank you for registering with Chef-kay restaurant!</p>
        <p>Your account is currently pending verification. Our team is reviewing your business license and will notify you once the process is complete.</p>
        <p>If you have any questions in the meantime, feel free to reach out to our support team:</p>
        <p>
                Email: <a href="mailto:${supportEmail}">${supportEmail}</a><br>
                Phone: ${supportPhone}
        </p>
        <p>Best regards,<br>The Chef-kay restaurant Team</p>`,
    };
};
exports.pendingVerificationEmail = pendingVerificationEmail;
const PasswordResetEmail = (restaurant) => {
    return {
        from: process.env.nodemailerEmail,
        to: restaurant.email,
        subject: 'Password Reset Confirmation',
        html: `
            <p>Hello ${restaurant.name},</p>
            <p>Your password has been successfully reset. If you did not perform this action, please contact our support team immediately.</p>
           <p>Best regards,<br>The Chef-kay restaurant Team</p>`,
    };
};
exports.PasswordResetEmail = PasswordResetEmail;
//# sourceMappingURL=email-template.js.map