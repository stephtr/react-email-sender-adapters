// @ts-ignore
import { EmailOptions } from './index.js';
import { encodeAttachmentToBase64, parseMail } from './tools.js';

export async function sendEmail(email: React.ReactElement,
    options: EmailOptions<{ url?: string; token?: string; }>) {

    const mail = await parseMail(email, options);
    if (!mail) return;
    const { from, to, cc, bcc, reply_to, text, html } = mail;

    const url = options.url ?? process.env.ZEPTOMAIL_URL;
    const token = options.token ?? process.env.ZEPTOMAIL_TOKEN;
    if (!url) throw new Error('No url provided for Zeptomail. You can also set the environment variable `ZEPTOMAIL_URL`.');
    if (!token) throw new Error('No token provided for Zeptomail. You can also set the environment variable `ZEPTOMAIL_TOKEN`.');

    const result = await fetch(`https://${url}/v1.1/email`, {
        method: 'POST',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Authorization': token,
        },
        body: JSON.stringify({
            from: { address: from.email, name: from.name },
            to: to.map(({ email, name }) => ({ "email_address": { address: email, name } })),
            cc: cc?.map(({ email, name }) => ({ "email_address": { address: email, name } })),
            bcc: bcc?.map(({ email, name }) => ({ "email_address": { address: email, name } })),
            replyTo: reply_to ? [{ address: reply_to.email, name: reply_to.name }] : undefined,
            subject: options.subject,
            textbody: text,
            htmlbody: html,
            attachments: options.attachments?.map(attachment => ({ "mime_type": attachment.contentType, "name": attachment.filename, "content": encodeAttachmentToBase64(attachment.content) })),
        }),
    });

    if (result.status >= 200 && result.status < 300) return;
    throw new Error(`Error sending email: ${result.status} ${await result.text()}`);
}