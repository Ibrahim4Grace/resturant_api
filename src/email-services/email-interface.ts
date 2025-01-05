export interface EmailTemplate {
    subject: string;
    template: string;
}

export interface EmailPayload {
    to: string;
    templateName: string;
    data: Record<string, any>;
}
