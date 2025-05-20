// lib/mailer.js
import { google } from 'googleapis';
import fs from 'fs';
import winston from 'winston';
import dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(process.cwd(), '.env.local') });

// Logger setup
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'debug',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.printf(({ timestamp, level, message, ...meta }) =>
      `${timestamp} [${level.toUpperCase()}] ${message} ${Object.keys(meta).length ? JSON.stringify(meta) : ''}`
    )
  ),
  transports: [new winston.transports.Console()],
});

// Load service account key
let key;
try {
  const keyEnv = process.env.GOOGLE_MAILER_SA_KEY_JSON;
  if (!keyEnv) throw new Error('Missing GOOGLE_MAILER_SA_KEY_JSON');
  key = keyEnv.trim().startsWith('{')
    ? JSON.parse(keyEnv)
    : JSON.parse(fs.readFileSync(resolve(process.cwd(), keyEnv), 'utf8'));
} catch (err) {
  logger.error('Failed to load service account key', { error: err.message });
  process.exit(1);
}

// Initialize JWT client
const jwtClient = new google.auth.JWT({
  email: key.client_email,
  key: key.private_key,
  scopes: ['https://www.googleapis.com/auth/gmail.send'],
  subject: process.env.GOOGLE_MAILER_IMPERSONATE,
});

// Prepare Gmail API client
const gmail = google.gmail({ version: 'v1', auth: jwtClient });

/**
 * Sends an invite email with a styled button link
 * @param {string} to - Recipient email
 * @param {string} inviteLink - URL the user clicks to accept invite
 * @param {Object} meta - Additional metadata for logging
 */
export async function sendInviteEmail(to, inviteLink, meta = {}) {
  logger.info('Sending invite', { to, inviteLink });

  const from = process.env.GOOGLE_MAILER_IMPERSONATE;
  const subject = 'You’re invited to join CompanyFlash!';

  // A reliable, table-based HTML email
  const htmlBody = `
  <!DOCTYPE html>
  <html lang="en"><head><meta charset="UTF-8"><title>Invite</title></head>
  <body style="margin:0;padding:0;background-color:#f4f4f4;">
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
      <tr><td align="center">
        <table width="600" cellpadding="0" cellspacing="0" role="presentation"
               style="background:#fff;margin:20px 0;border-radius:8px;overflow:hidden;">
          <tr><td style="padding:30px;font-family:Arial,sans-serif;color:#333;">
            <h1 style="margin-top:0;">You’re invited!</h1>
            <p>Someone on CompanyFlash has invited you. Click below to accept:</p>
            <p style="text-align:center;margin:30px 0;">
              <a href="${inviteLink}" style="
                display:inline-block;
                padding:12px 24px;
                background-color:#1d4ed8;
                color:#fff;
                text-decoration:none;
                border-radius:4px;
                font-weight:bold;
              ">Accept Invitation</a>
            </p>
            <p>If the button doesn’t work, copy & paste this link:</p>
            <p><a href="${inviteLink}" style="color:#1d4ed8;">${inviteLink}</a></p>
            <p style="margin-top:30px;font-size:0.9em;color:#666;">
              If you didn’t request this, ignore this email.<br/>— The CompanyFlash Team
            </p>
          </td></tr>
        </table>
      </td></tr>
    </table>
  </body></html>
  `;

  // Build the raw message
  const raw = [
    `From: ${from}`,
    `To: ${to}`,
    `Subject: ${subject}`,
    'MIME-Version: 1.0',
    'Content-Type: text/html; charset=UTF-8',
    '',
    htmlBody,
  ].join('\r\n');

  // Base64-url encode
  const encoded = Buffer.from(raw)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  try {
    const res = await gmail.users.messages.send({
      userId: 'me',
      requestBody: { raw: encoded },
    });
    logger.info('Invite email sent', { to, messageId: res.data.id, ...meta });
    return res.data;
  } catch (err) {
    logger.error('Failed to send invite email', { to, inviteLink, error: err, ...meta });
    throw err;
  }
}
