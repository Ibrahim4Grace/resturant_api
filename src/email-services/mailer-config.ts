export const EMAIL_TEMPLATES: Record<
    string,
    { subject: string; template: string }
> = {
    otpVerification: {
        subject: "Your 6-digit Verification Code",
        template: "otp-verification.hbs",
    },
    passwordReset: {
        subject: "Password Reset Request",
        template: "password-reset.hbs",
    },
};

export const REDIS_CONFIG = {
    host: process.env.REDIS_HOST || "localhost",
    port: parseInt(process.env.REDIS_PORT || "6379"),
};

export const SMTP_CONFIG = {
    service: process.env.MAILER_SERVICE,
    host: "smtp.gmail.com",
    auth: {
        user: process.env.NODEMAILER_EMAIL,
        pass: process.env.NODEMAILER_PASSWORD,
    },
    pool: true,
    maxConnections: 5,
    rateDelta: 1000,
    rateLimit: 5,
};
