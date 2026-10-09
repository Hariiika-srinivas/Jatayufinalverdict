/**
 * Vercel Serverless Function: /api/telegram-test
 * Verifies credentials, executes getMe, and transmits a test signal to Telegram.
 */
import { verifyTelegramBot, sendTelegramAlert, maskChatId } from './_telegramService';

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const token = process.env.TELEGRAM_BOT_TOKEN?.trim();
    const chatId = process.env.TELEGRAM_CHAT_ID?.trim();

    if (!token || !chatId) {
      const missing: string[] = [];
      if (!token) missing.push('TELEGRAM_BOT_TOKEN');
      if (!chatId) missing.push('TELEGRAM_CHAT_ID');
      return res.status(500).json({
        ok: false,
        code: 'MISSING_CREDENTIALS',
        error: `Telegram credentials not configured on the server. Missing: ${missing.join(', ')}.`
      });
    }

    // Step 1: verify bot token with getMe
    const botCheck = await verifyTelegramBot();
    if (!botCheck.ok) {
      return res.status(401).json({
        ok: false,
        botVerified: false,
        delivered: false,
        code: botCheck.code || 'INVALID_TOKEN',
        error: `Telegram bot verification failed: ${botCheck.error}`
      });
    }

    // Step 2: send test message to configured chat
    const sendResult = await sendTelegramAlert({
      eventType: 'test',
      testNotes: `Direct connection verification requested from JATAYU Command Center. Bot: ${botCheck.botUsername || 'Active'}`
    });

    if (!sendResult.ok) {
      return res.status(400).json({
        ok: false,
        botVerified: true,
        delivered: false,
        botUsername: botCheck.botUsername,
        chatId: maskChatId(chatId),
        error: `Bot verified (${botCheck.botUsername || 'active'}), but test message delivery failed: ${sendResult.error}`
      });
    }

    return res.status(200).json({
      ok: true,
      botVerified: true,
      delivered: true,
      botUsername: botCheck.botUsername,
      chatId: maskChatId(chatId),
      messageId: sendResult.messageId,
      message: `Connection verified! Test alert delivered to Chat ID ${maskChatId(chatId)} via ${botCheck.botUsername || 'bot'}.`
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal Server Error';
    return res.status(500).json({ ok: false, error: message });
  }
}
