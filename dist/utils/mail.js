"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendMail = void 0;
const nodemailer_1 = __importDefault(require("nodemailer"));
const index_1 = require("@/middlewares/index");
const index_2 = require("@/config/index");
const sendMail = async (emailcontent) => {
    const transporter = nodemailer_1.default.createTransport({
        service: index_2.config.MAILER_SERVICE,
        host: 'smtp.gmail.com',
        auth: {
            user: index_2.config.NODEMAILER_EMAIL,
            pass: index_2.config.NODEMAILER_PASSWORD,
        },
    });
    try {
        await transporter.sendMail(emailcontent);
        return 'Email sent successfully.';
    }
    catch (error) {
        console.error(error);
        throw new index_1.ServerError('INTERNAL_SERVER_ERROR');
    }
};
exports.sendMail = sendMail;
//# sourceMappingURL=mail.js.map