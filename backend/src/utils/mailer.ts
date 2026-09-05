import nodemailer from 'nodemailer';
import { env } from '../config/env';
import { logger } from '../lib/logger';

const transporter =
  env.SMTP_HOST && env.SMTP_USER
    ? nodemailer.createTransport({
        host: env.SMTP_HOST,
        port: env.SMTP_PORT,
        secure: env.SMTP_PORT === 465,
        auth: { user: env.SMTP_USER, pass: env.SMTP_PASS },
      })
    : null;

export async function sendMail(to: string, subject: string, html: string) {
  if (!transporter) {
    // Dev fallback: no SMTP configured, print instead of send.
    logger.info('[mail:dev] email not sent (no SMTP configured)', { to, subject, html });
    return;
  }
  await transporter.sendMail({ from: env.MAIL_FROM, to, subject, html });
}

export function passwordResetEmail(name: string, link: string) {
  return `
    <p>Hi ${name},</p>
    <p>We received a request to reset your NexFlow Tools password.</p>
    <p><a href="${link}">Reset your password</a> (valid for 1 hour).</p>
    <p>If you didn't request this, you can safely ignore this email.</p>
  `;
}
