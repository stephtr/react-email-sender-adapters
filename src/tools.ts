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

export function quotedPrintableEncode(input: string): string {
    const encoder = new TextEncoder(); // encodes to UTF-8 bytes
    const bytes = encoder.encode(input);
    let result = '';
    let lineLength = 0;
  
    const softBreak = () => {
      result += '=\r\n';
      lineLength = 0;
    };
  
    for (let i = 0; i < bytes.length; i++) {
      const byte = bytes[i];
  
      // Printable ASCII range excluding '=' (equals)
      const isPrintable =
        (byte >= 33 && byte <= 60) || (byte >= 62 && byte <= 126);
  
      let toAppend;
  
      if (byte === 0x3D || !isPrintable) {
        // Needs encoding (e.g. "=" or non-printable)
        toAppend = '=' + byte.toString(16).toUpperCase().padStart(2, '0');
      } else {
        toAppend = String.fromCharCode(byte);
      }
  
      // Line length: soft wrap at 76 characters
      if (lineLength + toAppend.length > 75) {
        softBreak();
      }
  
      result += toAppend;
      lineLength += toAppend.length;
    }
  
    return result;
}

function bytesToBase64(bytes: Uint8Array): string {
    let binary = '';
    const CHUNK_SIZE = 0x8000; // 32KB
    for (let i = 0; i < bytes.length; i += CHUNK_SIZE) {
      const chunk = bytes.subarray(i, i + CHUNK_SIZE);
      binary += String.fromCharCode.apply(null, chunk as unknown as number[]);
    }
    return btoa(binary);
  }

export function encodeAttachmentToBase64(content: Buffer | ArrayBuffer | string): string {
    if (typeof content === 'string') {
        return content;
    } else if (content instanceof ArrayBuffer) {
        return bytesToBase64(new Uint8Array(content));
    } else if (Buffer.isBuffer(content)) {
        return content.toString('base64');
    } else {
        throw new Error('Unsupported attachment content format (supported: string, Buffer, ArrayBuffer)');
    }
}
