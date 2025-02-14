import { v2 as cloudinary } from 'cloudinary';
import { config } from '../config/index';

export class CloudinaryService {
    constructor() {
        cloudinary.config({
            cloud_name: config.CLOUDINARY_CLOUD_NAME,
            api_key: config.CLOUDINARY_API_NAME,
            api_secret: config.CLOUDINARY_SECRET_NAME,
        });
    }

    public async uploadImage(
        file: Express.Multer.File,
    ): Promise<{ imageId: string; imageUrl: string }> {
        return new Promise((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(
                { folder: 'restaurants_api' },
                (error, result) => {
                    if (error) return reject(error);
                    resolve({
                        imageId: result?.public_id || '',
                        imageUrl: result?.secure_url || '',
                    });
                },
            );

            // Pass the file buffer to the upload stream
            uploadStream.end(file.buffer);
        });
    }
}
