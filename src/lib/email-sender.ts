import { Resend } from "resend";
import { buildEmailHtml } from "./email-template";

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM = process.env.RESEND_FROM_EMAIL ?? "SimsForHire <hello@simsforhire.com>";
const CC_EMAIL = "seva@simsforhire.com";

export interface SendEmailOptions {
  to: string;
  subject: string;
  bodyHtml: string;
  leadName?: string | null;
  skipCc?: boolean;
}

export async function sendEmail(opts: SendEmailOptions): Promise<void> {
  const html = buildEmailHtml(opts.bodyHtml, opts.leadName);

  const { error } = await resend.emails.send({
    from: FROM,
    to: opts.to,
    ...(opts.skipCc ? {} : { cc: [CC_EMAIL] }),
    subject: opts.subject,
    html,
  });

  if (error) throw new Error(`Resend error: ${error.message}`);
}
