import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, Plugin} from 'vite';

function telegramDevPlugin(): Plugin {
  return {
    name: 'telegram-dev-plugin',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (req.url === '/api/telegram-alert' && req.method === 'POST') {
          let body = '';
          req.on('data', (chunk) => {
            body += chunk;
          });
          req.on('end', async () => {
            try {
              const {sendTelegramAlert} = await import('./src/services/telegramService');
              const payload = body ? JSON.parse(body) : {};
              const result = await sendTelegramAlert(payload);
              res.setHeader('Content-Type', 'application/json');
              res.statusCode = result.ok ? 200 : (result.code === 'MISSING_CREDENTIALS' ? 500 : 400);
              res.end(JSON.stringify(result));
            } catch (err: unknown) {
              const message = err instanceof Error ? err.message : 'Internal error';
              res.setHeader('Content-Type', 'application/json');
              res.statusCode = 500;
              res.end(JSON.stringify({ok: false, error: message}));
            }
          });
          return;
        }
        if (req.url === '/api/telegram-test') {
          try {
            const {verifyTelegramBot, sendTelegramAlert, maskChatId} = await import('./src/services/telegramService');
            const token = process.env.TELEGRAM_BOT_TOKEN?.trim();
            const chatId = process.env.TELEGRAM_CHAT_ID?.trim();
            if (!token || !chatId) {
              res.setHeader('Content-Type', 'application/json');
              res.statusCode = 500;
              return res.end(
                JSON.stringify({
                  ok: false,
                  code: 'MISSING_CREDENTIALS',
                  error: 'Telegram credentials not configured on the server. Missing: TELEGRAM_BOT_TOKEN and/or TELEGRAM_CHAT_ID.',
                })
              );
            }
            const botCheck = await verifyTelegramBot();
            if (!botCheck.ok) {
              res.setHeader('Content-Type', 'application/json');
              res.statusCode = 401;
              return res.end(
                JSON.stringify({
                  ok: false,
                  botVerified: false,
                  delivered: false,
                  code: botCheck.code || 'INVALID_TOKEN',
                  error: `Telegram bot verification failed: ${botCheck.error}`,
                })
              );
            }
            const sendResult = await sendTelegramAlert({
              eventType: 'test',
              testNotes: `Direct connection verification requested from JATAYU Command Center. Bot: ${botCheck.botUsername || 'Active'}`,
            });
            res.setHeader('Content-Type', 'application/json');
            res.statusCode = sendResult.ok ? 200 : 400;
            res.end(
              JSON.stringify({
                ok: sendResult.ok,
                botVerified: true,
                delivered: sendResult.delivered,
                botUsername: botCheck.botUsername,
                chatId: maskChatId(chatId),
                messageId: sendResult.messageId,
                message: sendResult.ok
                  ? `Connection verified! Test alert delivered to Chat ID ${maskChatId(chatId)} via ${botCheck.botUsername || 'bot'}.`
                  : `Bot verified (${botCheck.botUsername || 'active'}), but test message delivery failed: ${sendResult.error}`,
                error: sendResult.ok ? undefined : sendResult.error,
              })
            );
          } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Internal error';
            res.setHeader('Content-Type', 'application/json');
            res.statusCode = 500;
            res.end(JSON.stringify({ok: false, error: message}));
          }
          return;
        }
        next();
      });
    },
  };
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), telegramDevPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(import.meta.dirname || '.', '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
