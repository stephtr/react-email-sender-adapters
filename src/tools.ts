import { renderAsync } from '@react-email/render';
import { EmailOptions, MailContact, MailContacts, defaultEmailOptions } from './index.js';

export function mailContactToType(contact: MailContact): {
    name?: string;
    email: string;
} {
    if (typeof contact === 'string') {
        return { email: contact };
    }
    return contact;
}

export function mailContactsToType(contacts: MailContacts): Array<{
    name?: string;
    email: string;
}> {
    return Array.isArray(contacts)
        ? contacts.map(mailContactToType)
        : [mailContactToType(contacts)];
}

export async function parseMail(email: React.ReactElement,
    options: EmailOptions) {
    const [html, text] = await Promise.all([
        renderAsync(email),
        renderAsync(email, { plainText: true }),
    ]);

    const data = {
        from: mailContactToType(options.from),
        to: mailContactsToType(options.to),
        cc: options.cc ? mailContactsToType(options.cc) : undefined,
        bcc: options.bcc
            ? mailContactsToType(options.bcc)
            : undefined,
        reply_to: options.replyTo
            ? mailContactToType(options.replyTo)
            : undefined,
        text,
        html,
    };

    const useConsoleLogInDevMode = options.useConsoleLogInDevMode ?? defaultEmailOptions.useConsoleLogInDevMode;
    if (process.env.NODE_ENV === 'development' && useConsoleLogInDevMode) {
        const toContact = data.to.map((c) => (c.name ? `${c.name} <${c.email}>` : c.email))
            .join(', ');

        // eslint-disable-next-line no-console
        console.log(`\n📧 to ${toContact}: ${options.subject}\n${text}\n`);
        return;
    }

    return data;
}
