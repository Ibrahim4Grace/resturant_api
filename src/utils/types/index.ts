export interface MulterFile {
    fieldname: string;
    originalname: string;
    encoding: string;
    mimetype: string;
    size: number;
    destination: string;
    filename: string;
    path: string;
    buffer: Buffer;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    stream: any;
}

export interface EmailData {
    from: string;
    to: string;
    subject: string;
    html: string;
}

export interface JwtPayload {
    user_id: string;
    role: string;
}
