# react-email-sender-adapters

A unified interface for sending react-email emails across multiple email services. This package supports sending emails through console.log (development environment), AWS SES, MailChannels, and Azure Communication Services.

## Features

- Full support for `react-email`
- Support for multiple email providers:
  - AWS SES (`@aws-sdk/client-ses` is a required peerDependency)
  - MailChannels (including support for DKIM configuration)
  - Azure Communication Services (`@azure/communication-email` is a required peerDependency)
- Development mode logging

## Installation

```bash
npm install react-email-sender-adapters
```

### Azure Communication Services

If you want to use this package in combination with Azure Communication Services, you additionally have to install the peer dependency `@azure/communication-email`:

```bash
npm install @azure/communication-email
```

## Quick Start

### Sending Basic Emails

```jsx
// use this import for Mailchannels;
// for Azure Communication Services, import from `react-email-sender-adapters/to-azure-communication`
import sendEmail from "react-email-sender-adapters/to-mailchannels";
import TestEmail from "./TestEmail";

try {
  await sendEmail(<TestEmail />, {
    subject: "Test email",
    from: { name: "John Doe", email: "john@example.com" },
    to: { email: "smith@example.com" },
  });
} catch (e) {
  console.error(`Error sending the mail: ${e.message}`);
}
```

In development mode, this will output the email in the console. In production, the email will be sent via your chosen provider. To also use the provider in dev mode, set `useConsoleLogInDevMode: false` when calling `sendEmail`. Alternatively, you can write the following:

```js
import { defaultEmailOptions } from "react-email-sender-adapters";
defaultEmailOptions.useConsoleLogInDevMode = false;
```

## API Reference

```ts
type DefaultEmailOptions = {
  useConsoleLogInDevMode: boolean;
};

type EmailOptions = Partial<DefaultEmailOptions> & {
  subject: string;
  from: MailContact;
  to: MailContacts;
  cc?: MailContacts;
  bcc?: MailContacts;
  replyTo?: MailContact;
  attachments?: Array<Attachment>;
};

type MailContact = string | { name?: string; email: string };
type MailContacts = MailContact | Array<MailContact>;

type Attachment = {
  contentType: string;
  filename: string;
  content: Buffer | ArrayBuffer | string; // base64 encoded string
};
```

### AWS SES

For sending mails with AWS SES, one needs to configure the following settings:

```ts
type AWSEmailOptions = EmailOptions & {
  region?: string; // alternatively, set the env variable `AWS_SES_REGION`
  accessKeyId?: string; // alternatively, set `AWS_SES_ACCESS_KEY_ID`
  secretAccessKey?: string; // alternatively, set `AWS_SES_SECRET_ACCESS_KEY`
};
```

### Mailchannels

MailChannels supports signing your emails using DKIM. You can either supply the DKIM domain, selector, and private key to your EmailOptions, or provide them as environment variables `DKIM_DOMAIN`, `DKIM_SELECTOR`, and `DKIM_PRIVATE_KEY`, which will be automatically picked up.

```ts
type MailchannelsEmailOptions = EmailOptions & {
  dkim?: {
    domain: string;
    selector: string;
    privateKey: string;
  };
};
```

### Azure Communication Services

To communicate with Azure Communication Services, a connection string is required. This can be supplied either via the environment variable `AZURE_COMMUNICATION_CONNECTION_STRING` or via your EmailOptions.

```ts
type AzureEmailOptions = EmailOptions & {
  connectionString?: string;
};
```

### Zeptomail

For Zeptomail, the `url` and `token` parameters are needed. You can also supply them via the environment variables `ZEPTOMAIL_URL` and `ZEPTOMAIL_TOKEN`.

```ts
type ZeptomailEmailOptions = EmailOptions & {
  url?: string;
  token?: string;
};
```

Use this package to easily send React-based emails through multiple providers with robust support for development and production environments.
