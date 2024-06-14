import { EmailOptions } from './index.js';
import { parseMail } from './tools.js';

export type DKIMOptions = {
    domain: string;
    selector: string;
    privateKey: string;
};

export async function sendEmail(email: React.ReactElement,
    options: EmailOptions<{ dkim?: DKIMOptions }>) {

    const mail = await parseMail(email, options);
    if (!mail) return;
    const { from, to, cc, bcc, reply_to, text, html } = mail;

    let { dkim } = options;
    if (
        !dkim &&
        process.env.DKIM_DOMAIN &&
        process.env.DKIM_SELECTOR &&
        process.env.DKIM_PRIVATE_KEY
    ) {
        dkim = {
            domain: process.env.DKIM_DOMAIN,
            selector: process.env.DKIM_SELECTOR,
            privateKey: process.env.DKIM_PRIVATE_KEY,
        };
    }
    const request = await fetch('https://api.mailchannels.net/tx/v1/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            from: from,
            subject: options.subject,
            personalizations: [
                {
                    to,
                    cc,
                    bcc,
                    reply_to,
                    dkim_domain: dkim?.domain ?? undefined,
                    dkim_private_key: dkim?.privateKey ?? undefined,
                    dkim_selector: dkim?.selector ?? undefined,
                },
            ],
            content: [
                {
                    type: 'text/plain; charset="utf-8"',
                    value: text,
                },
                ...(html
                    ? [
                        {
                            type: 'text/html; charset="utf-8"',
                            value: html,
                        },
                    ]
                    : []),
                ...(options.attachments?.map(a => ({
                    type:
                        `${a.contentType.replace(/[^a-z\/]/g, '')}\n` +
                        `Content-Transfer-Encoding: base64\n` +
                        `Content-Disposition: attachment; filename="${a.filename.replace(/([\\"])/g, '\\$1')}"`,
                    value:
                        typeof a.content === 'string' ?
                            a.content :
                            Buffer.from(a.content).toString('base64'),
                })) ?? []),
            ],
        }),
    });
    if (request.status !== 202) {
        throw new Error(
            `Failed to send email: ${request.status} ${await request.text()}`,
        );
    }
}