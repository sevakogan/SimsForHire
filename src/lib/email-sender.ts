import { Resend } from "resend";
import { buildEmailHtml } from "./email-template";

const FROM = process.env.RESEND_FROM_EMAIL ?? "SimsForHire <hello@simsforhire.com>";
const CC_EMAIL = "seva@simsforhire.com";

// Lazy init: instantiating Resend at module load throws if the API key is
// missing (e.g. in Vercel preview envs that don't have RESEND_API_KEY set),
// which crashes any route that transitively imports this file during
// `next build`'s page-data collection. We defer instantiation to first call.
let _resend: Resend | null = null;
function getResend(): Resend {
  if (_resend) return _resend;
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error("RESEND_API_KEY is not configured");
  _resend = new Resend(key);
  return _resend;
}

export interface SendEmailOptions {
  to: string;
  subject: string;
  bodyHtml: string;
  leadName?: string | null;
  skipCc?: boolean;
}

export async function sendEmail(opts: SendEmailOptions): Promise<void> {
  const html = buildEmailHtml(opts.bodyHtml, opts.leadName);

  const { error } = await getResend().emails.send({
    from: FROM,
    to: opts.to,
    ...(opts.skipCc ? {} : { cc: [CC_EMAIL] }),
    subject: opts.subject,
    html,
  });

  if (error) throw new Error(`Resend error: ${error.message}`);
}
