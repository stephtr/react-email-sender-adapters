import { SESClient, SendRawEmailCommand } from '@aws-sdk/client-ses';
import { createMimeMessage, Mailbox } from 'mimetext/browser';
import { EmailOptions } from './index.js';
import { parseMail } from './tools.js';

function encodeAttachmentToBase64(content: Buffer | ArrayBuffer | string): string {
    if (typeof content === 'string') {
        return content;
    } else if (content instanceof ArrayBuffer) {
        return btoa(new TextDecoder('ascii').decode(content));
    } else if (Buffer.isBuffer(content)) {
        return content.toString('base64');
    } else {
        throw new Error('Unsupported attachment content format (supported: string, Buffer, ArrayBuffer)');
    }
}

export async function sendEmail(email: React.ReactElement,
    options: EmailOptions<{ region?: string; accessKeyId?: string; secretAccessKey?: string }>) {

    const mail = await parseMail(email, options);
    if (!mail) return;
    const { from, to, cc, bcc, reply_to, text, html } = mail;

    const region = options.region ?? process.env.AWS_SES_REGION;
    const accessKeyId = options.accessKeyId ?? process.env.AWS_SES_ACCESS_KEY_ID;
    const secretAccessKey = options.secretAccessKey ?? process.env.AWS_SES_SECRET_ACCESS_KEY;
    if (!region) throw new Error('No region provided for AWS SES. You can set the environment variable `AWS_SES_REGION`.');
    if (!accessKeyId) throw new Error('No access key ID provided for AWS SES. You can set the environment variable `AWS_SES_ACCESS_KEY_ID`.');
    if (!secretAccessKey) throw new Error('No secret access key provided for AWS SES. You can set the environment variable `AWS_SES_SECRET_ACCESS_KEY`.');

    const client = new SESClient({ region, credentials: { accessKeyId, secretAccessKey } });
    
    const msg = createMimeMessage();
    msg.setSender({ addr: from.email, name: from.name });
    msg.setRecipients(to.map(({ email, name }) => ({ addr: email, name })));
    if (cc) msg.setCc(cc.map(({ email, name }) => ({ addr: email, name })));
    if (bcc) msg.setCc(bcc.map(({ email, name }) => ({ addr: email, name })));
    if (reply_to) msg.setHeader('Reply-To', new Mailbox({ addr: reply_to.email, name: reply_to.name }));
    msg.setSubject(options.subject);
    msg.addMessage({ contentType: 'text/plain', data: text });
    msg.addMessage({ contentType: 'text/html', data: html });
    for (const attachment of options.attachments || []) {
        msg.addAttachment({
            contentType: attachment.contentType,
            filename: attachment.filename,
            data: encodeAttachmentToBase64(attachment.content),
        });
    }

    const mailCommand = new SendRawEmailCommand({ RawMessage: { Data: new TextEncoder().encode(msg.asRaw()) } });

    await client.send(mailCommand);
}