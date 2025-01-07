import { createBullBoard } from "@bull-board/api";
import { ExpressAdapter } from "@bull-board/express";
import { emailQueue } from "@/utils/index";
import { BullAdapter } from "@bull-board/api/bullAdapter";

const ServerAdapter = new ExpressAdapter();

createBullBoard({
    queues: [
        new BullAdapter(emailQueue),
        // new BullAdapter(emailQueue)
    ],
    serverAdapter: ServerAdapter,
});

ServerAdapter.setBasePath(`/api/queues/${process.env.BULL_PASSKEY}`);
export { ServerAdapter };
