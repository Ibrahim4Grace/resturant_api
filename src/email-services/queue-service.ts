import Bull from "bull";
import { REDIS_CONFIG } from "./mailer-config";
import { EmailPayload } from "./email-interface";

export class QueueService {
    private emailQueue: Bull.Queue;

    constructor() {
        this.emailQueue = new Bull("email-queue", {
            redis: REDIS_CONFIG,
            limiter: {
                max: 10,
                duration: 1000,
            },
        });
    }

    async addToQueue(payload: EmailPayload): Promise<void> {
        await this.emailQueue.add(payload, {
            attempts: 3,
            backoff: {
                type: "exponential",
                delay: 2000,
            },
        });
    }

    getQueue(): Bull.Queue {
        return this.emailQueue;
    }
}
