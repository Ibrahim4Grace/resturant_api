"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.newMenuConfirmationEmail = void 0;
const newMenuConfirmationEmail = (restaurant, menuItem) => {
    return {
        from: process.env.nodemailerEmail,
        to: restaurant.email,
        subject: `New Menu Item Added: ${menuItem.name}`,
        html: `
            <p>Dear ${restaurant.name} Team,</p>
            <p>We are pleased to inform you that a new menu item has been successfully added to your restaurant:</p>
            <ul>
                <li><strong>Name:</strong> ${menuItem.name}</li>
                <li><strong>Price:</strong> #${menuItem.price}</li>
                ${menuItem.category ? `<li><strong>Category:</strong> ${menuItem.category}</li>` : ''}
                ${menuItem.description ? `<li><strong>Description:</strong> ${menuItem.description}</li>` : ''}
            </ul>
            ${menuItem.image?.imageUrl ? `<p><strong>Image:</strong> <br> <img src="${menuItem.image.imageUrl}" alt="${menuItem.name}" width="200"/></p>` : ''}
            <p>If you did not authorize this change, please contact support immediately.</p>
             <p>Best regards,<br>The Chef-kay restaurant Team</p>
        `,
    };
};
exports.newMenuConfirmationEmail = newMenuConfirmationEmail;
//# sourceMappingURL=menu-email-template.js.map