/**
 * JATAYU — Vercel Serverless Function: /api/telegram-test
 * Fully self-contained. Works identically on Node.js Serverless and Web/Edge runtimes.
 * Never leaks credentials.
 */

function sanitizeBotToken(raw: string | undefined): string {
  if (!raw) return '';
  let token = raw.trim();
  if ((token.startsWith('"') && token.endsWith('"')) || (token.startsWith("'") && token.endsWith("'"))) {
    token = token.slice(1, -1).trim();
  }
  if (token.startsWith('<') && token.endsWith('>')) {
    token = token.slice(1, -1).trim();
  }
  const urlMatch = token.match(/(?:https?:\/\/)?api\.telegram\.org\/bot([^\s/]+)/i);
  if (urlMatch && urlMatch[1]) {
    token = urlMatch[1].trim();
  }
  if (token.toLowerCase().startsWith('bot')) {
    const rem = token.slice(3).trim();
    if (/^\d+:/.test(rem)) token = rem;
  }
  return token.replace(/\/+$/, '').trim();
}

function sanitizeChatId(raw: string | undefined): string {
  if (!raw) return '';
  let id = String(raw).trim();
  if ((id.startsWith('"') && id.endsWith('"')) || (id.startsWith("'") && id.endsWith("'"))) {
    id = id.slice(1, -1).trim();
  }
  if (id.startsWith('<') && id.endsWith('>')) {
    id = id.slice(1, -1).trim();
  }
  return id.trim();
}

function maskChatId(id: string): string {
  if (!id) return '***';
  const s = String(id).trim();
  if (s.length <= 4) return '***';
  return s.slice(0, 3) + '***' + s.slice(-3);
}

async function telegramRequest(token: string, method: string, payload?: Record<string, unknown>) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 12000);

  try {
    const response = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
      method: payload ? 'POST' : 'GET',
      headers: payload ? { 'Content-Type': 'application/json' } : undefined,
      body: payload ? JSON.stringify(payload) : undefined,
      signal: controller.signal
    });

    const text = await response.text();
    let data: any;
    try {
      data = JSON.parse(text);
    } catch {
      throw new Error(`Telegram returned non-JSON response (HTTP ${response.status})`);
    }

    if (!response.ok || !data.ok) {
      const desc = data.description || `Telegram request failed (HTTP ${response.status})`;
      const err = new Error(desc);
      (err as any).statusCode = response.status;
      (err as any).errorCode = data.error_code || response.status;
      throw err;
    }

    return data;
  } finally {
    clearTimeout(timeoutId);
  }
}

async function handleTelegramTest() {
  const token = sanitizeBotToken(process.env.TELEGRAM_BOT_TOKEN);
  const chatId = sanitizeChatId(process.env.TELEGRAM_CHAT_ID);

  if (!token || !chatId) {
    const missing = [];
    if (!token) missing.push('TELEGRAM_BOT_TOKEN');
    if (!chatId) missing.push('TELEGRAM_CHAT_ID');
    return {
      status: 500,
      data: {
        ok: false,
        code: 'MISSING_CREDENTIALS',
        error: `Telegram configuration is missing on the server. Missing: ${missing.join(', ')}. Add them to Vercel Project Settings -> Environment Variables.`
      }
    };
  }

  // 1. Verify getMe
  let botUsername = '@bot';
  try {
    const getMeData = await telegramRequest(token, 'getMe');
    botUsername = getMeData.result?.username ? `@${getMeData.result.username}` : 'JATAYU Bot';
  } catch (err: any) {
    let message = err?.message || 'Bot verification failed';
    if (err?.errorCode === 404 || err?.statusCode === 404) {
      message = "Telegram returned 404 Not Found. Ensure TELEGRAM_BOT_TOKEN does not contain 'bot', brackets, or quotes.";
    } else if (err?.errorCode === 401 || err?.statusCode === 401) {
      message = "Telegram returned 401 Unauthorized. The bot token is invalid or was revoked in @BotFather.";
    }
    return {
      status: 401,
      data: {
        ok: false,
        botVerified: false,
        delivered: false,
        code: 'INVALID_TOKEN',
        error: `Telegram bot verification failed: ${message}`
      }
    };
  }

  // 2. Send test message
  const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19) + ' UTC';
  try {
    const sendData = await telegramRequest(token, 'sendMessage', {
      chat_id: chatId,
      text: `🧪 <b>JATAYU TELEGRAM TEST</b>\n\n<i>If you received this message, Telegram delivery is working!</i>\n\n<b>Time:</b> <code>${timestamp}</code>\n<b>Bot:</b> ${botUsername}\n<b>Target:</b> <code>${maskChatId(chatId)}</code>\n\nDisaster alerts and tactical notifications are verified for this channel.`,
      parse_mode: 'HTML',
      disable_web_page_preview: true
    });

    return {
      status: 200,
      data: {
        ok: true,
        botVerified: true,
        delivered: true,
        botUsername,
        chatId: maskChatId(chatId),
        messageId: sendData.result?.message_id,
        message: `Connection verified! Test alert delivered to Chat ID ${maskChatId(chatId)} via ${botUsername}.`
      }
    };
  } catch (err: any) {
    let msg = err?.message || 'Failed to deliver message';
    if (String(msg).includes('chat not found')) {
      msg = `Chat ID (${maskChatId(chatId)}) not found. For private chats, the recipient must open Telegram, search ${botUsername}, and press /start.`;
    }
    return {
      status: 400,
      data: {
        ok: false,
        botVerified: true,
        delivered: false,
        botUsername,
        chatId: maskChatId(chatId),
        error: `Bot verified as ${botUsername}, but message delivery failed: ${msg}`
      }
    };
  }
}

// Node.js Serverless runtime export
export default async function handler(req: any, res: any) {
  if (res && typeof res.setHeader === 'function') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  }

  if (req && req.method === 'OPTIONS') {
    if (res && typeof res.status === 'function') return res.status(200).end();
    return new Response(null, { status: 200 });
  }

  try {
    const result = await handleTelegramTest();
    if (res && typeof res.status === 'function') {
      return res.status(result.status).json(result.data);
    }
    return Response.json(result.data, { status: result.status });
  } catch (e: any) {
    const errData = { ok: false, error: e?.message || 'Internal Server Error' };
    if (res && typeof res.status === 'function') return res.status(500).json(errData);
    return Response.json(errData, { status: 500 });
  }
}

// Web Standard / Edge runtime exports
export async function GET(request: Request) {
  try {
    const result = await handleTelegramTest();
    return Response.json(result.data, {
      status: result.status,
      headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' }
    });
  } catch (e: any) {
    return Response.json({ ok: false, error: e?.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const result = await handleTelegramTest();
    return Response.json(result.data, {
      status: result.status,
      headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' }
    });
  } catch (e: any) {
    return Response.json({ ok: false, error: e?.message || 'Internal Server Error' }, { status: 500 });
  }
}
