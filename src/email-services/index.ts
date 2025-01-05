import { QueueService } from "./queue-service";
import { TemplateService } from "./template-service";
import { MailerService } from "./mailer-service";
import { EMAIL_TEMPLATES } from "./mailer-config";
import { EmailPayload } from "./email-interface";

export class EmailService {
    private queueService: QueueService;
    private templateService: TemplateService;
    private mailerService: MailerService;

    constructor() {
        this.queueService = new QueueService();
        this.templateService = new TemplateService();
        this.mailerService = new MailerService();
        this.initializeQueueProcessor();
    }

    private async initializeQueueProcessor(): Promise<void> {
        const queue = this.queueService.getQueue();

        queue.process(async (job) => {
            const { to, templateName, data } = job.data;

            try {
                const template = await this.templateService.loadTemplate(
                    EMAIL_TEMPLATES[templateName].template,
                );
                const html = template(data);

                await this.mailerService.sendMail(
                    to,
                    EMAIL_TEMPLATES[templateName].subject,
                    html,
                );

                return "Email sent successfully";
            } catch (error) {
                console.error("Email sending failed:", error);
                throw error;
            }
        });

        queue.on("failed", (job, err) => {
            console.error(`Job ${job.id} failed with error:`, err);
        });
    }

    public async queueEmail(payload: EmailPayload): Promise<void> {
        await this.queueService.addToQueue(payload);
    }
}
