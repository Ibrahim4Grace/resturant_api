import { resolve } from "path";
import handlebars from "handlebars";
import fs from "fs/promises";

export class TemplateService {
    private templatesDir: string;

    constructor() {
        this.templatesDir = resolve(__dirname, "../templates");
    }

    async loadTemplate(
        templateName: string,
    ): Promise<HandlebarsTemplateDelegate> {
        const templatePath = resolve(this.templatesDir, templateName);
        const templateContent = await fs.readFile(templatePath, "utf-8");
        return handlebars.compile(templateContent);
    }
}
