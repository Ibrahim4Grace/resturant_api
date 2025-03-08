import { IOrder } from '../order/order-interface';
import { IUser } from '../user/user-interface';
import { EmailData } from '../../types/index';
// import { formatCurrency } from '../../utils';

export const orderConfirmationEmail = (
    user: Pick<IUser, 'name' | 'email'>,
    updatedOrder: IOrder,
): EmailData => {
    const orderedItemsList = updatedOrder.items
        .map(
            (item) => `
        <tr>
            <td>${item.name}</td> 
            <td>${item.quantity}</td>
            <td>$${item.price.toFixed(2)}</td>
            <td>$${(item.quantity * item.price).toFixed(2)}</td>
        </tr>
    `,
        )
        .join('');

    return {
        from: process.env.nodemailerEmail as string,
        to: user.email,
        subject: `Order Confirmation - ${updatedOrder.order_number}`,
        html: `
            <p>Dear ${user.name},</p>
            <p>Your order (#${updatedOrder.order_number}) has been placed successfully.</p>
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
            <p><strong>Subtotal:</strong> $${updatedOrder.subtotal.toFixed(2)}</p>
            <p><strong>Tax:</strong> $${updatedOrder.tax.toFixed(2)}</p>
            <p><strong>Delivery Fee:</strong> $${updatedOrder.delivery_fee.toFixed(2)}</p>
            <p><strong>Total Price:</strong> $${updatedOrder.total_price.toFixed(2)}</p>
            <p>Thank you for choosing us!</p>
            <p>Best regards,<br>The Chef-kay Restaurant Team</p>
        `,
    };
};

// export const paymentDisbursementEmail = (
//     recipient: { name: string; email: string },
//     order: IOrder,
//     amount: number,
//     recipientType: 'restaurant' | 'rider',
// ): EmailData => {
//     const title =
//         recipientType === 'restaurant'
//             ? 'Restaurant Payment Confirmation'
//             : 'Rider Commission Payment';

//     const subject =
//         recipientType === 'restaurant'
//             ? `Payment Received for Order #${order.order_number}`
//             : `Commission Received for Delivery #${order.order_number}`;

//     const intro =
//         recipientType === 'restaurant'
//             ? `Dear ${recipient.name}, we've processed your payment for order #${order.order_number}.`
//             : `Dear ${recipient.name}, we've processed your commission for delivering order #${order.order_number}.`;

//     const description =
//         recipientType === 'restaurant'
//             ? `Your restaurant payment has been processed and is on its way to your bank account. The funds should appear in your account within 24-48 hours, depending on your bank's processing time.`
//             : `Your delivery commission has been processed and is on its way to your bank account. The funds should appear in your account within 24-48 hours, depending on your bank's processing time.`;

//     return {
//         from: 'no-reply@restaurant.com',
//         to: recipient.email,
//         subject,
//         html: `<p>${intro}</p><p>${description}</p>`,
//         context: {
//             title,
//             name: recipient.name,
//             intro,
//             description,
//             orderDetails: {
//                 orderNumber: order.order_number,
//                 orderDate: new Date(order.createdAt).toLocaleDateString(),
//                 amount: formatCurrency(amount),
//             },
//             ctaText: 'View Details',
//             ctaUrl:
//                 recipientType === 'restaurant'
//                     ? `${process.env.FRONTEND_URL}/restaurant/orders/${order._id}`
//                     : `${process.env.FRONTEND_URL}/rider/deliveries/${order._id}`,
//             footerText:
//                 'If you have any questions about this payment, please contact our support team.',
//         },
//     };
// };
