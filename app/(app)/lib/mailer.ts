// app/(app)/lib/mailer.ts
import { google } from 'googleapis'
import fs          from 'fs'
import winston     from 'winston'
import dotenv      from 'dotenv'
import { resolve } from 'path'

dotenv.config({ path: resolve(process.cwd(), '.env.local') })

interface ServiceAccountKey {
  client_email: string
  private_key:  string
}

export interface InviteMeta {
  inviterEmail: string
  businessName: string
  inviteId:     string
}

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'debug',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.printf(({ timestamp, level, message, ...meta }) =>
      `${timestamp} [${level.toUpperCase()}] ${message} ${Object.keys(meta).length ? JSON.stringify(meta) : ''}`
    )
  ),
  transports: [new winston.transports.Console()],
})

let key: ServiceAccountKey
try {
  const keyEnv = process.env.GOOGLE_MAILER_SA_KEY_JSON
  if (!keyEnv) throw new Error('Missing GOOGLE_MAILER_SA_KEY_JSON')
  key = keyEnv.trim().startsWith('{')
    ? JSON.parse(keyEnv)
    : JSON.parse(fs.readFileSync(resolve(process.cwd(), keyEnv), 'utf8'))
} catch (err: unknown) {
  const msg = err instanceof Error ? err.message : String(err)
  logger.error('Failed to load service account key', { error: msg })
  process.exit(1)
}

const jwtClient = new google.auth.JWT({
  email:   key.client_email,
  key:     key.private_key,
  scopes:  ['https://www.googleapis.com/auth/gmail.send'],
  subject: process.env.GOOGLE_MAILER_IMPERSONATE,
})

const gmail = google.gmail({ version: 'v1', auth: jwtClient })

export async function sendInviteEmail(
  to: string,
  inviteLink: string,
  meta: InviteMeta
) {
  logger.info('Sending invite email', { to, inviteLink, ...meta })

  const from    = process.env.GOOGLE_MAILER_IMPERSONATE!
  const subject = `You’ve been invited to join ${meta.businessName}!`

  const htmlBody = `
    <!DOCTYPE html>
    <html lang="en"><head><meta charset="UTF-8"><title>Invite</title></head>
    <body style="margin:0;padding:0;background-color:#f4f4f4;">
      <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
        <tr><td align="center">
          <table width="600" cellpadding="0" cellspacing="0" role="presentation"
                 style="background:#fff;margin:20px 0;border-radius:8px;overflow:hidden;">
            <tr><td style="padding:30px;font-family:Arial,sans-serif;color:#333;">
              <h1 style="margin-top:0;">You’re invited to ${meta.businessName}!</h1>
              <p><em>${meta.inviterEmail}</em> has invited you to join their team.</p>
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
              <p>If that button doesn’t work, copy & paste this link:</p>
              <p><a href="${inviteLink}" style="color:#1d4ed8;">${inviteLink}</a></p>
              <p style="margin-top:30px;font-size:0.9em;color:#666;">
                If you didn't expect this, feel free to ignore this email.<br/>
                — The CompanyFlash Team
              </p>
            </td></tr>
          </table>
        </td></tr>
      </table>
    </body></html>
  `
  const raw = [
    `From: ${from}`,
    `To: ${to}`,
    `Subject: ${subject}`,
    'MIME-Version: 1.0',
    'Content-Type: text/html; charset=UTF-8',
    '',
    htmlBody,
  ].join('\r\n')

  const encoded = Buffer.from(raw)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')

  try {
    const res = await gmail.users.messages.send({
      userId: 'me',
      requestBody: { raw: encoded },
    })
    logger.info('Invite email sent', { to, messageId: res.data.id, ...meta })
    return res.data
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    logger.error('Failed to send invite email', { to, inviteLink, error: msg, ...meta })
    throw err
  }
}
