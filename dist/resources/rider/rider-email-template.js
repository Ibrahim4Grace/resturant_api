"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PasswordResetEmail = exports.welcomeEmail = exports.sendOTPByEmail = void 0;
const sendOTPByEmail = (rider, otp) => {
    const otpExpiryMillis = Number(process.env.OTP_EXPIRY);
    const otpExpiryHour = otpExpiryMillis / (60 * 60 * 1000);
    return {
        from: process.env.nodemailerEmail,
        to: rider.email,
        subject: "Your 6-digit Verification Code",
        html: `  <p>Dear ${rider.name}, </p>
          <p>Use the 6-digit Code provided below to verify your email:</p>
          <p>Your verification code is: <b>${otp}</b></p>
          <p>This code will expire in ${otpExpiryHour} hour.</p>
          <p>If you didn't register, please ignore this email.</p>
          <p>Best regards,<br>The Chef-kay restaurant Team</p>`,
    };
};
exports.sendOTPByEmail = sendOTPByEmail;
const welcomeEmail = (rider) => {
    return {
        from: process.env.nodemailerEmail,
        to: rider.email,
        subject: "Welcome to Chef-kay restaurant",
        html: `  <p>Dear ${rider.name}, </p>
           
        <p>Your account has been successfully created, granting you access to our platform's exciting features.</p>
        <p>Should you have any inquiries or require assistance, please don't hesitate to contact our support team.Your satisfaction is our priority, and we are committed to providing you with the assistance you need.</p>
          <p>Best regards,<br>The Chef-kay restaurant Team</p>`,
    };
};
exports.welcomeEmail = welcomeEmail;
const PasswordResetEmail = (rider) => {
    return {
        from: process.env.nodemailerEmail,
        to: rider.email,
        subject: "Password Reset Confirmation",
        html: `
            <p>Hello ${rider.name},</p>
            <p>Your password has been successfully reset. If you did not perform this action, please contact our support team immediately.</p>
            <p>Best regards,<br>The Chef-kay restaurant Team</p>`,
    };
};
exports.PasswordResetEmail = PasswordResetEmail;
//# sourceMappingURL=rider-email-template.js.map