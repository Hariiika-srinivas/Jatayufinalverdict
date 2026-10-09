/**
 * Vercel Serverless Function: /api/telegram-alert
 * Dispatches structured JATAYU emergency alerts to the configured Telegram channel.
 */
import { sendTelegramAlert } from './_telegramService';

export default async function handler(req: any, res: any) {
  // CORS support if called cross-origin
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Method not allowed. Use POST.' });
  }

  try {
    const payload = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const result = await sendTelegramAlert(payload);
    const statusCode = result.ok ? 200 : (result.code === 'MISSING_CREDENTIALS' ? 500 : 400);
    return res.status(statusCode).json(result);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal Server Error';
    return res.status(500).json({ ok: false, error: message });
  }
}
