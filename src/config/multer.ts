import multer from 'multer';
import { Request } from 'express';
import { BadRequest } from '@/middlewares/index';

export const multerConfig = {
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit
    },
    fileFilter: (
        req: Request,
        file: Express.Multer.File,
        cb: multer.FileFilterCallback,
    ) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new BadRequest('Only image files are allowed'));
        }
    },
};

export const upload = multer(multerConfig);
