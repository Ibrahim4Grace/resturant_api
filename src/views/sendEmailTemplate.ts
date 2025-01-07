import fs from "fs";
import Handlebars from "handlebars";
import path from "path";
import { addEmailToQueue } from "@/utils/index";

const baseTemplateSource = fs.readFileSync(
    path.join(__dirname, "templates", "base_template.hbs"),
    "utf8",
);
Handlebars.registerPartial("base_template", baseTemplateSource);

function renderTemplate(templateName: string, variables: {}) {
    const data = {
        logoUrl: "https://i.imghippo.com/files/bOlgU1724265767.png",
        imageUrl: "https://example.com/reset-password.png",
        companyName: "AIForHomework",
        supportUrl: "https://example.com/support",
        socialIcons: [
            {
                url: "https://facebook.com",
                imgSrc: "https://app-rsrc.getbee.io/public/resources/social-networks-icon-sets/t-only-logo-dark-gray/facebook@2x.png",
                alt: "Facebook",
            },
            {
                url: "https://twitter.com",
                imgSrc: "https://app-rsrc.getbee.io/public/resources/social-networks-icon-sets/t-only-logo-dark-gray/twitter@2x.png",
                alt: "Twitter",
            },
            {
                url: "https://instagram.com",
                imgSrc: "https://app-rsrc.getbee.io/public/resources/social-networks-icon-sets/t-only-logo-dark-gray/instagram@2x.png",
                alt: "Instagram",
            },
            {
                url: "https://facebook.com",
                imgSrc: "https://app-rsrc.getbee.io/public/resources/social-networks-icon-sets/t-only-logo-dark-gray/linkedin@2x.png",
                alt: "Linkedin",
            },
            {
                url: "https://facebook.com",
                imgSrc: "https://app-rsrc.getbee.io/public/resources/social-networks-icon-sets/t-only-logo-dark-gray/discord@2x.png",
                alt: "Discord",
            },
        ],
        companyWebsite: "https://aiforhomework.com/",
        preferencesUrl: "https://aiforhomework.com/",
        unsubscribeUrl: "https://aiforhomework.com/",
    };
    const newData = { ...data, ...variables };
    const templateSource = fs.readFileSync(
        path.join(__dirname, "templates", `${templateName}.hbs`),
        "utf8",
    );
    const template = Handlebars.compile(templateSource);
    return template(newData);
}

async function sendEmailTemplate({
    from,
    to,
    subject,
    templateName,
    variables,
}: {
    from?: string;
    to: string;
    subject: string;
    templateName: string;
    variables: {};
}): Promise<{ status: boolean; message: string }> {
    const html = renderTemplate(templateName, variables);

    return await addEmailToQueue({
        from: from || "Chefkayfood <support@chefkayfood.com>",
        to,
        subject,
        html,
    });
}

export default sendEmailTemplate;
