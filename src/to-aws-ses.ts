import { AwsClient } from 'aws4fetch';
import { createMimeMessage, Mailbox } from 'mimetext/browser';
import { EmailOptions } from './index.js';
import { encodeAttachmentToBase64, parseMail, quotedPrintableEncode } from './tools.js';

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

    const aws = new AwsClient({ region, accessKeyId, secretAccessKey });
    
    const msg = createMimeMessage();
    msg.setSender({ addr: from.email, name: from.name });
    msg.setRecipients(to.map(({ email, name }) => ({ addr: email, name })));
    if (cc) msg.setCc(cc.map(({ email, name }) => ({ addr: email, name })));
    if (bcc) msg.setBcc(bcc.map(({ email, name }) => ({ addr: email, name })));
    if (reply_to) msg.setHeader('Reply-To', new Mailbox({ addr: reply_to.email, name: reply_to.name }));
    msg.setSubject(options.subject);
    msg.addMessage({ contentType: 'text/plain', data: quotedPrintableEncode(text), encoding: 'quoted-printable' });
    msg.addMessage({ contentType: 'text/html', data: quotedPrintableEncode(html), encoding: 'quoted-printable' });
    for (const attachment of options.attachments || []) {
        msg.addAttachment({
            contentType: attachment.contentType,
            filename: attachment.filename,
            data: encodeAttachmentToBase64(attachment.content),
        });
    }

    const result = await aws.fetch(`https://email.${region}.amazonaws.com`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
            Action: 'SendRawEmail',
            "RawMessage.Data": btoa(msg.asRaw()),
        }).toString(),
    });

    if (result.status !== 200) {
        throw new Error(`Failed to send email: ${result.status} ${await result.text()}`);
    }
}