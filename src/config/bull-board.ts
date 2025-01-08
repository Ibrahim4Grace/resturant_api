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

ServerAdapter.setBasePath(`/admin/queues`);
export { ServerAdapter };
