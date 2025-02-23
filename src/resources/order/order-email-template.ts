import { IOrder } from '../../resources/order/order-interface';
import { IUser } from '../../resources/user/user-interface';
import { EmailData } from '../../types/index';

export const orderStatusUpdateEmail = (
    user: IUser,
    updatedOrder: IOrder,
): EmailData => {
    return {
        from: process.env.nodemailerEmail as string,
        to: user.email,
        subject: 'Order Status Update',
        html: `<p>Hi ${user.name}, your order (#${updatedOrder.order_number}) status has been updated to ${updatedOrder.status}.</p>
        <p>Best regards,<br>The Chef-kay restaurant Team</p>`,
    };
};

export const orderCancellationEmail = (
    user: IUser,
    order: IOrder,
): EmailData => {
    return {
        from: process.env.nodemailerEmail as string,
        to: user.email,
        subject: 'Order Cancelled',
        html: `<p>Hi ${user.name}, your order (#${order.order_number}) has been cancelled.</p>
        <p>Best regards,<br>The Chef-kay restaurant Team</p>`,
    };
};
