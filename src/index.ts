export type MailContact =
    | {
        name?: string;
        email: string;
    }
    | string;
export type MailContacts = MailContact | Array<MailContact>;

export type Attachment = {
    contentType: string;
    filename: string;
    content: Buffer | ArrayBuffer | string;
};

export type DefaultEmailOptions = {
    useConsoleLogInDevMode: boolean;
};

export const defaultEmailOptions: DefaultEmailOptions = {
    useConsoleLogInDevMode: true,
};

export type EmailOptions<T = {}> = T & Partial<DefaultEmailOptions> & {
    subject: string;
    from: MailContact;
    to: MailContacts;
    cc?: MailContacts;
    bcc?: MailContacts;
    replyTo?: MailContact;
    attachments?: Array<Attachment>;
};
