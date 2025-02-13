"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendJsonResponse = void 0;
/**
 * Sends a JSON response with a standard structure.
 *
 * @param res - The Express response object.
 * @param statusCode - The HTTP status code to send.
 * @param message - The message to include in the response.
 * @param data - The data to include in the response. Can be any type.
 * @param accessToken - Optional access token to include in the response.
 */
const sendJsonResponse = (res, statusCode, message, data, accessToken) => {
    const responsePayload = {
        status: "success",
        message,
        status_code: statusCode,
        data,
    };
    if (accessToken) {
        responsePayload.access_token = accessToken;
    }
    res.status(statusCode).json(responsePayload);
};
exports.sendJsonResponse = sendJsonResponse;
//# sourceMappingURL=responsehelper.js.map