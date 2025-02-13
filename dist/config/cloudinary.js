"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CloudinaryService = void 0;
const cloudinary_1 = require("cloudinary");
const index_1 = require("@/config/index");
class CloudinaryService {
    constructor() {
        cloudinary_1.v2.config({
            cloud_name: index_1.config.CLOUDINARY_CLOUD_NAME,
            api_key: index_1.config.CLOUDINARY_API_NAME,
            api_secret: index_1.config.CLOUDINARY_SECRET_NAME,
        });
    }
    async uploadImage(file) {
        return new Promise((resolve, reject) => {
            const uploadStream = cloudinary_1.v2.uploader.upload_stream({ folder: 'restaurants_api' }, (error, result) => {
                if (error)
                    return reject(error);
                resolve({
                    imageId: result?.public_id || '',
                    imageUrl: result?.secure_url || '',
                });
            });
            // Pass the file buffer to the upload stream
            uploadStream.end(file.buffer);
        });
    }
}
exports.CloudinaryService = CloudinaryService;
//# sourceMappingURL=cloudinary.js.map