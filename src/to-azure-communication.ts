import { EmailClient } from '@azure/communication-email';
import { EmailOptions } from './index.js';
import { encodeAttachmentToBase64, parseMail } from './tools.js';

export type DKIMOptions = {
    domain: string;
    selector: string;
    privateKey: string;
};

export async function sendEmail(email: React.ReactElement,
    options: EmailOptions<{ connectionString?: string }>) {

    const mail = await parseMail(email, options);
    if (!mail) return;
    const { from, to, cc, bcc, reply_to, text, html } = mail;

    const connectionString = options.connectionString ?? process.env.AZURE_COMMUNICATION_CONNECTION_STRING;

    if (!connectionString)
        throw new Error('No connection string provided for Azure Communication Services. You can set the environment variable `AZURE_COMMUNICATION_CONNECTION_STRING`.');

    const client = new EmailClient(connectionString);

    const poller = await client.beginSend({
        senderAddress: from.email,
        headers: from.name ? { From: `"${from.name}" <${from.email}>` } : undefined,
        content: {
            subject: options.subject,
            plainText: text,
            html,
        },
        recipients: {
            to: to.map(({ email, name }) => ({ address: email, displayName: name })),
            cc: cc?.map(({ email, name }) => ({ address: email, displayName: name })),
            bcc: bcc?.map(({ email, name }) => ({ address: email, displayName: name })),
        },
        replyTo: reply_to ? [{ address: reply_to.email, displayName: reply_to.name }] : undefined,
        attachments: options.attachments?.map(a => ({
            name: a.filename,
            contentType: a.contentType,
            contentInBase64: encodeAttachmentToBase64(a.content),
        })),
    });
    const response = await poller.pollUntilDone();
    if (response.error) {
        throw new Error(
            `Failed to send email: ${response.error.code} ${response.error.message}`,
        );
    }
}