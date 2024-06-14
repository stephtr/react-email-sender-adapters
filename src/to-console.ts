import { EmailOptions } from './index.js';
import { parseMail } from './tools.js';

export async function sendEmail(email: React.ReactElement,
    options: EmailOptions) {

    const mail = await parseMail(email, { ...options, useConsoleLogInDevMode: true });
    if (!mail) return;

    throw new Error(
        'Sending email: no provider was chosen. For production mode, please import `sendEmail` from your chosen provider.',
    );
}