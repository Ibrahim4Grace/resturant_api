import nodemailer from "nodemailer";
import { EmailOptions } from "@/types/index";
import { ServerError } from "@/middlewares/index";

export const sendMail = async (emailcontent: EmailOptions) => {
    const transporter = nodemailer.createTransport({
        service: process.env.MAILER_SERVICE,
        host: "smtp.gmail.com",
        auth: {
            user: process.env.NODEMAILER_EMAIL,
            pass: process.env.NODEMAILER_PASSWORD,
        },
    });

    try {
        await transporter.sendMail(emailcontent);
        return "Email sent successfully.";
    } catch (error) {
        console.error(error);
        throw new ServerError("INTERNAL_SERVER_ERROR");
    }
};
