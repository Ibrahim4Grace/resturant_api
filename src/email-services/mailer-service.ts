import nodemailer from "nodemailer";
import { SMTP_CONFIG } from "./mailer-config";

export class MailerService {
    private transporter: nodemailer.Transporter;

    constructor() {
        this.transporter = nodemailer.createTransport(SMTP_CONFIG);
    }

    async sendMail(to: string, subject: string, html: string): Promise<void> {
        await this.transporter.sendMail({
            from: process.env.NODEMAILER_EMAIL,
            to,
            subject,
            html,
        });
    }
}
