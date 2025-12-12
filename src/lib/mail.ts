import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_SERVER_HOST,
    port: Number(process.env.EMAIL_SERVER_PORT),
    secure: false, // true for 465, false for other ports
    auth: {
        user: process.env.MAILJET_API_KEY,
        pass: process.env.MAILJET_SECRET_KEY,
    },
});

export async function sendEmail({
    to,
    subject,
    html,
}: {
    to: string;
    subject: string;
    html: string;
}) {
    if (!to || !process.env.MAILJET_API_KEY) {
        console.warn('Skipping email: Missing recipient or credentials');
        return;
    }

    try {
        const info = await transporter.sendMail({
            from: `"Link Locker" <${process.env.EMAIL_FROM}>`,
            to,
            subject,
            html,
        });
        console.log('Message sent: %s', info.messageId);
        return info;
    } catch (error) {
        console.error('Error sending email:', error);
        throw error;
    }
}
