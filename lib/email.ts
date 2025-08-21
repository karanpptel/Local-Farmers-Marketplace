import {Resend} from 'resend';

export const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendEmail(params: {
    to: string | string[];
    subject: string;
    react: React.ReactElement;
    html?: string;
    from?: string; //optional 

}) {
    const { to, subject, react, html, from } = params;

    if(!process.env.RESEND_API_KEY) {
        throw new Error("RESEND_API_KEY missing. Skipping email send.");
    }

    try {
        await resend.emails.send({
           from: from ?? (process.env.EMAIL_FROM as string),
            to,
            subject,
            text: html ?? "This is a plain text fallback for your email.",
            ...(react ? { react } : html ? { html } : {}),
        });
    } catch (error) {
        console.error("Error sending email:", error);
        throw new Error("Failed to send email");
    }
}