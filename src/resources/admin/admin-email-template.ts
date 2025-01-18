import { EmailData } from "@/types/index";

export const sendOTPByEmail = (
    admin: { name: string; email: string },
    otp: string,
): EmailData => {
    const otpExpiryMillis = Number(process.env.OTP_EXPIRY);
    const otpExpiryHour = otpExpiryMillis / (60 * 60 * 1000);
    return {
        from: process.env.nodemailerEmail as string,
        to: admin.email,
        subject: "Your 6-digit Verification Code",
        html: `  <p>Dear ${admin.name}, </p>
          <p>Use the 6-digit Code provided below to verify your email:</p>
          <p>Your verification code is: <b>${otp}</b></p>
         <p>This code will expire in ${otpExpiryHour} hour.</p>
          <p>If you didn't register, please ignore this email.</p>
      <p>Best regards,<br>The Chef-kay restaurant Team</p>`,
    };
};

export const welcomeEmail = (admin: {
    name: string;
    email: string;
}): EmailData => {
    return {
        from: process.env.nodemailerEmail as string,
        to: admin.email,
        subject: "Welcome to Chef-kay restaurant",
        html: `  <p>Dear ${admin.name}, </p>
           
        <p>Your account has been successfully created, granting you access to our platform's exciting features.</p>
        <p>Should you have any inquiries or require assistance, please don't hesitate to contact our support team.Your satisfaction is our priority, and we are committed to providing you with the assistance you need.</p>
       <p>Best regards,<br>The Chef-kay restaurant Team</p>`,
    };
};

export const PasswordResetEmail = (admin: {
    name: string;
    email: string;
}): EmailData => {
    return {
        from: process.env.nodemailerEmail as string,
        to: admin.email,
        subject: "Password Reset Confirmation",
        html: `
            <p>Hello ${admin.name},</p>
            <p>Your password has been successfully reset. If you did not perform this action, please contact our support team immediately.</p>
             <p>Best regards,<br>The Chef-kay restaurant Team</p>`,
    };
};
