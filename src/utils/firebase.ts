import admin from 'firebase-admin';
import { config } from '../config/index';
import { log } from '../utils/index';

// const serviceAccount = {
//     projectId: config.FIREBASE_PROJECT_ID,
//     privateKey: config.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'), // Handling the newlines in the private key
//     clientEmail: config.FIREBASE_CLIENT_EMAIL,
// };

// admin.initializeApp({
//     credential: admin.credential.cert(serviceAccount),
// });

export const sendFirebaseNotification = async (
    token: string,
    message: string,
): Promise<void> => {
    try {
        await admin.messaging().send({
            token,
            notification: {
                title: 'Notification',
                body: message,
            },
        });
        log.info('Firebase notification sent successfully');
    } catch (error) {
        log.error('Failed to send Firebase notification:', error);
        throw error;
    }
};
