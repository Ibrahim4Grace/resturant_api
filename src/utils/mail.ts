import nodemailer from 'nodemailer';
import { EmailData } from '@/types/index';
import { ServerError } from '@/middlewares/index';
import { config } from '@/config/index';

export const sendMail = async (emailcontent: EmailData) => {
    const transporter = nodemailer.createTransport({
        service: config.MAILER_SERVICE,
        host: 'smtp.gmail.com',
        auth: {
            user: config.NODEMAILER_EMAIL,
            pass: config.NODEMAILER_PASSWORD,
        },
    });

    try {
        await transporter.sendMail(emailcontent);
        return 'Email sent successfully.';
    } catch (error) {
        console.error(error);
        throw new ServerError('INTERNAL_SERVER_ERROR');
    }
};
