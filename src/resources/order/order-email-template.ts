import { IOrder } from '@/resources/order/order-interface';
import { IUser } from '@/resources/user/user-interface';
import { EmailData } from '@/types/index';

export const orderConfirmationEmail = (
    user: IUser,
    order: IOrder,
): EmailData => {
    return {
        from: process.env.nodemailerEmail as string,
        to: user.email,
        subject: 'Order Confirmation',
        html: `  <p>Dear ${user.name}, </p>
          <p>Your order (#${order._id}) has been placed successfully.</p><p>Total: $${order.total}</p><p>Thank you for choosing us!</p>
          <p>Best regards,<br>The Chef-kay restaurant Team</p>`,
    };
};

export const orderStatusUpdateEmail = (
    user: IUser,
    order: IOrder,
): EmailData => {
    return {
        from: process.env.nodemailerEmail as string,
        to: user.email,
        subject: 'Order Status Update',
        html: `<p>Hi ${user.name}, your order (#${order._id}) status has been updated to ${order.status}.</p>
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
        html: `<p>Hi ${user.name}, your order (#${order._id}) has been cancelled.</p>
        <p>Best regards,<br>The Chef-kay restaurant Team</p>`,
    };
};

export const riderAssignedEmail = (user: IUser, order: IOrder): EmailData => {
    return {
        from: process.env.nodemailerEmail as string,
        to: user.email,
        subject: 'Rider Assigned',
        html: `<p>Hi ${user.name}, a rider has been assigned to your order (#${order._id}).</p>
        <p>Best regards,<br>The Chef-kay restaurant Team</p>`,
    };
};
