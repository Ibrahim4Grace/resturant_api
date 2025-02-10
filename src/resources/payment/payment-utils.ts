import crypto from 'crypto';

export const PaystackSignature = (
    secretKey: string,
    payload: any,
    signature: string,
): boolean => {
    const hmac = crypto.createHmac('sha512', secretKey);
    const computedSignature = hmac
        .update(JSON.stringify(payload))
        .digest('hex');
    return computedSignature === signature;
};
