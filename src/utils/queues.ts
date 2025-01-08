import Bull, { Job } from "bull";
import { sendMail, log } from "@/utils/index";
import { EmailData } from "@/types/index";

const retries: number = 2;
const delay: number = 1000 * 30;

const redisConfig = {
    host: process.env.REDIS_HOST,
    port: Number(process.env.REDIS_PORT),
};

function asyncHandler(fn: (job: Job) => Promise<void>) {
    return (job: Job, done: Bull.DoneCallback) => {
        Promise.resolve(fn(job))
            .then(() => done())
            .catch((err) => {
                log.error(err);
                done(err);
                job.moveToFailed({ message: err.message }, true);
            });
    };
}

export const emailQueue = new Bull("email", {
    redis: redisConfig,
    limiter: {
        max: 20,
        duration: 1000,
    },
});

export const addEmailToQueue = async (data: EmailData) => {
    try {
        await emailQueue.add(data, {
            jobId: `email-${data.to}-${Date.now()}`,
            attempts: retries,
            backoff: {
                type: "fixed",
                delay,
            },
        });

        return {
            status: true,
            message: "Email sent!",
        };
    } catch (error) {
        log.error(error);
        return {
            status: false,
            message:
                error instanceof Error
                    ? error.message
                    : "An unknown error occurred",
        };
    }
};

emailQueue.process(
    2,
    asyncHandler(async (job: Job) => {
        try {
            const emailOptions = job.data as EmailData;
            await sendMail(emailOptions);
            job.log("Email sent successfully to " + emailOptions.to);
        } catch (error) {
            log.error("Email processing error:", error);
            throw error;
        }
    }),
);

const handleJobCompletion = (queue: Bull.Queue, type: string) => {
    queue.on("completed", (job: Job) => {
        log.info(`${type} Job with id ${job.id} has been completed`);
    });

    queue.on("failed", (job: Job, error: Error) => {
        log.error(
            `${type} Job with id ${job.id} has failed with error: ${error.message}`,
        );
    });
};

emailQueue.on("error", (error) => {
    console.error("Redis connection error:", error);
});

// Verify Redis connection
const redis = emailQueue.client;
redis.on("error", (error) => {
    console.error("Redis client error:", error);
});

handleJobCompletion(emailQueue, "Email");
