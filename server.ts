/**
 * JATAYU — Full-Stack Server & Proxy
 * Provides healthchecks, sample dataset endpoints, and static serving in production.
 */

import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import dotenv from 'dotenv';
import { sendTelegramAlert, verifyTelegramBot, maskChatId } from './src/services/telegramService';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Telegram Alert Endpoint
app.post('/api/telegram-alert', async (req: Request, res: Response) => {
  try {
    const payload = req.body;
    const result = await sendTelegramAlert(payload);
    const statusCode = result.ok ? 200 : (result.code === 'MISSING_CREDENTIALS' ? 500 : 400);
    res.status(statusCode).json(result);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal Server Error';
    res.status(500).json({ ok: false, error: message });
  }
});

// Telegram Connection Test Endpoint
app.all('/api/telegram-test', async (req: Request, res: Response) => {
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
});

// Health Check
app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    service: 'JATAYU Disaster Intelligence Platform',
    timestamp: new Date().toISOString(),
    models: {
      prithvi_flood_segmentation: {
        name: 'Prithvi-EO-2.0-300M-TL-Sen1Floods11',
        checkpoint_loaded: true,
        input_bands: ['B2', 'B3', 'B4', 'B8A', 'B11', 'B12'],
        target: 'Surface Water & Flood Extent Segmentation'
      },
      building_footprint_detector: {
        name: 'High-Resolution Optical Building Detector',
        status: 'active',
        structural_damage_assessment: 'Not assessed — compatible damage model required'
      }
    },
    hardware: {
      device: 'CPU / Accelerated Web Worker'
    }
  });
});

// Sample datasets endpoint
app.get('/api/sample-datasets', (req: Request, res: Response) => {
  res.json({
    samples: [
      {
        id: 'india-assam-sen1floods11',
        name: 'India — Assam Brahmaputra Flood (Sen1Floods11)',
        file: 'India_900498_S2Hand.tif',
        bands_count: 13,
        compatible_models: ['Prithvi-EO-2.0-300M-TL-Sen1Floods11', 'Combined Exposure Pipeline']
      },
      {
        id: 'spain-ebro-sen1floods11',
        name: 'Spain — Ebro Basin Inundation',
        file: 'Spain_7370579_S2Hand.tif',
        bands_count: 13,
        compatible_models: ['Prithvi-EO-2.0-300M-TL-Sen1Floods11', 'Combined Exposure Pipeline']
      },
      {
        id: 'usa-midwest-sen1floods11',
        name: 'USA — Midwest Flooding Event',
        file: 'USA_430764_S2Hand.tif',
        bands_count: 13,
        compatible_models: ['Prithvi-EO-2.0-300M-TL-Sen1Floods11', 'Combined Exposure Pipeline']
      }
    ]
  });
});

// Serve dist directory in production
const distPath = path.join(__dirname, 'dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get('*', (req: Request, res: Response) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`[JATAYU] Server active on port ${PORT}`);
});
