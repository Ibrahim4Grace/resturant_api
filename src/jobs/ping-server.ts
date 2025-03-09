import https from 'https';
import cron from 'node-cron';
import { log } from '../utils/index';
import { config } from '../config/index';

interface KeepAliveResponse {
    statusCode?: number;
}

interface KeepAliveError extends Error {
    message: string;
}

const url = config.PROD_URL;

export const keepAlive = (url: string): void => {
    https
        .get(url, (res: KeepAliveResponse) => {
            log.info(`Status: ${res.statusCode}`);
        })
        .on('error', (error: KeepAliveError) => {
            log.error(`Errors: ${error.message}`);
        });
};

cron.schedule('*/5 * * * *', () => {
    keepAlive(url);
    log.info('Pinging the server every 5 minutes');
});
