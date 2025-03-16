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
