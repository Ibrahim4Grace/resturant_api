"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.riderAssignedEmail = exports.orderCancellationEmail = exports.orderStatusUpdateEmail = exports.orderConfirmationEmail = void 0;
const orderConfirmationEmail = (user, order) => {
    const orderedItemsList = order.items
        .map((item) => `
        <tr>
            <td>${item.name}</td> 
            <td>${item.quantity}</td>
            <td>$${item.price.toFixed(2)}</td>
            <td>$${(item.quantity * item.price).toFixed(2)}</td>
        </tr>
    `)
        .join('');
    return {
        from: process.env.nodemailerEmail,
        to: user.email,
        subject: `Order Confirmation - ${order.order_number}`,
        html: `
            <p>Dear ${user.name},</p>
            <p>Your order (#${order.order_number}) has been placed successfully.</p>
            <p>Here are the details of your order:</p>
            <table border="1" cellpadding="5" cellspacing="0">
                <thead>
                    <tr>
                        <th>Item</th>
                        <th>Quantity</th>
                        <th>Price</th>
                        <th>Total</th>
                    </tr>
                </thead>
                <tbody>
                    ${orderedItemsList}
                </tbody>
            </table>
            <p><strong>Subtotal:</strong> $${order.subtotal.toFixed(2)}</p>
            <p><strong>Tax:</strong> $${order.tax.toFixed(2)}</p>
            <p><strong>Delivery Fee:</strong> $${order.delivery_fee.toFixed(2)}</p>
            <p><strong>Total Price:</strong> $${order.total_price.toFixed(2)}</p>
            <p>Thank you for choosing us!</p>
            <p>Best regards,<br>The Chef-kay Restaurant Team</p>
        `,
    };
};
exports.orderConfirmationEmail = orderConfirmationEmail;
const orderStatusUpdateEmail = (user, updatedOrder) => {
    return {
        from: process.env.nodemailerEmail,
        to: user.email,
        subject: 'Order Status Update',
        html: `<p>Hi ${user.name}, your order (#${updatedOrder._id}) status has been updated to ${updatedOrder.status}.</p>
        <p>Best regards,<br>The Chef-kay restaurant Team</p>`,
    };
};
exports.orderStatusUpdateEmail = orderStatusUpdateEmail;
const orderCancellationEmail = (user, order) => {
    return {
        from: process.env.nodemailerEmail,
        to: user.email,
        subject: 'Order Cancelled',
        html: `<p>Hi ${user.name}, your order (#${order._id}) has been cancelled.</p>
        <p>Best regards,<br>The Chef-kay restaurant Team</p>`,
    };
};
exports.orderCancellationEmail = orderCancellationEmail;
const riderAssignedEmail = (user, order) => {
    return {
        from: process.env.nodemailerEmail,
        to: user.email,
        subject: 'Rider Assigned',
        html: `<p>Hi ${user.name}, a rider has been assigned to your order (#${order._id}).</p>
        <p>Best regards,<br>The Chef-kay restaurant Team</p>`,
    };
};
exports.riderAssignedEmail = riderAssignedEmail;
//# sourceMappingURL=order-email-template.js.map