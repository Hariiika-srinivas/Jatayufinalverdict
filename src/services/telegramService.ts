/**
 * JATAYU — Telegram Bot Integration Service
 * Secure, server-side gateway for Telegram Bot API emergency notifications.
 * Never exposes credentials to frontend code.
 */

export interface TelegramAlertPayload {
  eventType: 'predictive_risk' | 'drone_activated' | 'recon_finding' | 'analysis_completed' | 'manual_alert' | 'test';
  eventId?: string;
  alertId?: string;
  fingerprint?: string;
  region?: string;
  hazard?: string;
  riskScore?: number;
  riskLevel?: string;
  contributingFactors?: Array<{ name: string; impact: string; weight?: string }>;
  dataFreshness?: string;
  dataLimitations?: string;
  autoDroneTriggered?: boolean;
  droneStatus?: string;
  droneStartTime?: string;
  triggerReason?: string;
  floodExtentSqKm?: number;
  exposedBuildingsCount?: number;
  damagedBuildingsCount?: number;
  criticalInfrastructure?: string;
  recommendedAction?: string;
  completionStatus?: string;
  imagerySource?: string;
  modelErrors?: string;
  targetAgency?: string;
  zoneName?: string;
  priority?: string;
  severityScore?: number;
  tacticalNotes?: string;
  exposedPopulation?: number;
  hospitalsCount?: number;
  testNotes?: string;
}

export interface TelegramResponse {
  ok: boolean;
  delivered?: boolean;
  botVerified?: boolean;
  duplicate?: boolean;
  message?: string;
  error?: string;
  code?: string;
  chatId?: string;
  botUsername?: string;
  messageId?: number;
}

// In-memory deduplication cache: fingerprint -> timestamp
const deduplicationCache = new Map<string, number>();
const COOLDOWN_MS = 180 * 1000; // 3 minutes cooldown for repeated identical alerts

// Clean cache periodically
const cleanInterval = setInterval(() => {
  const now = Date.now();
  for (const [key, timestamp] of deduplicationCache.entries()) {
    if (now - timestamp > COOLDOWN_MS * 2) {
      deduplicationCache.delete(key);
    }
  }
}, 60 * 1000);

if (typeof cleanInterval === 'object' && cleanInterval !== null && 'unref' in cleanInterval) {
  (cleanInterval as { unref: () => void }).unref();
}

/**
 * Sanitizes and extracts the pure Telegram Bot Token.
 * Handles common user configuration mistakes:
 * - Accidental quotes: "123456:ABC" -> 123456:ABC
 * - Accidental angle brackets: <123456:ABC> -> 123456:ABC
 * - Accidental 'bot' prefix: bot123456:ABC -> 123456:ABC
 * - Accidental full URL: https://api.telegram.org/bot123456:ABC/getMe -> 123456:ABC
 * - Leading/trailing spaces, newlines, and slashes
 */
export function sanitizeBotToken(rawToken: string | undefined): string {
  if (!rawToken) return '';
  let token = rawToken.trim();

  // Strip wrapping double or single quotes
  if ((token.startsWith('"') && token.endsWith('"')) || (token.startsWith("'") && token.endsWith("'"))) {
    token = token.slice(1, -1).trim();
  }

  // Strip wrapping angle brackets
  if (token.startsWith('<') && token.endsWith('>')) {
    token = token.slice(1, -1).trim();
  }

  // Extract token if full Telegram URL was pasted
  const urlMatch = token.match(/(?:https?:\/\/)?api\.telegram\.org\/bot([^\s/]+)/i);
  if (urlMatch && urlMatch[1]) {
    token = urlMatch[1].trim();
  }

  // Strip accidental 'bot' prefix if followed by bot ID digits and colon
  if (token.toLowerCase().startsWith('bot')) {
    const remainder = token.slice(3).trim();
    if (/^\d+:/.test(remainder)) {
      token = remainder;
    }
  }

  // Strip any trailing slashes or whitespace
  return token.replace(/\/+$/, '').trim();
}

/**
 * Sanitizes Telegram Chat ID.
 * Handles quotes, spaces, and preserves channel usernames (@my_channel).
 */
export function sanitizeChatId(rawChatId: string | undefined): string {
  if (!rawChatId) return '';
  let chatId = rawChatId.trim();

  if ((chatId.startsWith('"') && chatId.endsWith('"')) || (chatId.startsWith("'") && chatId.endsWith("'"))) {
    chatId = chatId.slice(1, -1).trim();
  }

  if (chatId.startsWith('<') && chatId.endsWith('>')) {
    chatId = chatId.slice(1, -1).trim();
  }

  return chatId.trim();
}

/**
 * Safely masks chat ID for display in UI and logs without revealing the full ID.
 */
export function maskChatId(chatId: string): string {
  if (!chatId) return '';
  const str = String(chatId).trim();
  if (str.length <= 4) return '***';
  return str.slice(0, 3) + '***' + str.slice(-3);
}

function escapeHtml(text: unknown): string {
  if (text === null || text === undefined) return '';
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function formatTelegramMessage(payload: TelegramAlertPayload): { text: string; fingerprint: string } {
  const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19) + ' UTC';

  switch (payload.eventType) {
    case 'predictive_risk': {
      const region = escapeHtml(payload.region || 'Active Monitoring Zone');
      const hazard = escapeHtml(payload.hazard || 'Hydrometeorological Flooding');
      const score = payload.riskScore ?? 0;
      const level = escapeHtml(payload.riskLevel || 'ELEVATED');
      const factors = payload.contributingFactors?.length
        ? payload.contributingFactors.map(f => `• <b>${escapeHtml(f.name)}:</b> ${escapeHtml(f.impact)}`).join('\n')
        : '• 48h Precipitation accumulation exceeding drainage capacity\n• High soil saturation restricting infiltration';
      const droneStatus = payload.autoDroneTriggered
        ? 'AUTOMATICALLY TASKED & DEPLOYED'
        : 'Standby / Manual Authorization';
      const action = escapeHtml(payload.recommendedAction || 'Pre-position water rescue assets, prepare low-lying evacuation notices.');
      const freshness = escapeHtml(payload.dataFreshness || 'Open-Meteo NWP ECMWF/GFS Blend (Fresh) | Copernicus DEM 30m');

      const text = `🚨 <b>JATAYU EARLY WARNING</b>\n\n` +
        `<b>Hazard:</b> ${hazard}\n` +
        `<b>Region:</b> ${region}\n` +
        `<b>Risk Score:</b> <code>${score}/100</code>\n` +
        `<b>Risk Level:</b> <b>${level}</b>\n\n` +
        `<b>Contributing Factors:</b>\n${factors}\n\n` +
        `<b>Data Updated:</b> ${timestamp}\n` +
        `<b>Virtual Drone:</b> ${droneStatus}\n` +
        `<b>Recommended Action:</b> ${action}\n\n` +
        `<b>Data Status:</b> ${freshness}\n\n` +
        `<i>AI-assisted risk assessment. Verify conditions with official authorities.</i>`;

      const fingerprint = `risk-${payload.eventId || 'evt'}-${payload.region}-${score}-${level}`;
      return { text, fingerprint };
    }

    case 'drone_activated': {
      const region = escapeHtml(payload.region || 'Disaster AOI');
      const reason = escapeHtml(payload.triggerReason || 'Risk threshold crossed autonomous trigger criteria');
      const startTime = escapeHtml(payload.droneStartTime || timestamp);
      const status = escapeHtml(payload.droneStatus || 'TASKED & LOCKED');

      const text = `🚁 <b>JATAYU VIRTUAL DRONE ACTIVATION</b>\n\n` +
        `<b>Region:</b> ${region}\n` +
        `<b>Trigger Reason:</b> ${reason}\n` +
        `<b>Tasking Time:</b> ${startTime}\n` +
        `<b>Current Status:</b> <b>${status}</b>\n\n` +
        `<b>Protocol:</b> Multi-Catalog STAC Federation (Sentinel-1 SAR, NISAR L-band, Vantor VHR Optical)\n` +
        `<b>Objective:</b> Autonomous surface water delineation and building exposure inspection\n\n` +
        `<i>AI-assisted risk assessment. Verify conditions with official authorities.</i>`;

      const fingerprint = `drone-${payload.eventId || 'evt'}-${payload.region}-${status}`;
      return { text, fingerprint };
    }

    case 'recon_finding': {
      const region = escapeHtml(payload.region || 'Disaster AOI');
      const floodArea = payload.floodExtentSqKm !== undefined ? `${payload.floodExtentSqKm} km²` : 'Calculated in AOI';
      const buildings = payload.exposedBuildingsCount !== undefined
        ? `${payload.exposedBuildingsCount} structures exposed (${payload.damagedBuildingsCount || 0} compromised)`
        : 'Building inspection in progress';
      const infra = escapeHtml(payload.criticalInfrastructure || 'Key link roads and low-level bridges inundated');
      const action = escapeHtml(payload.recommendedAction || 'Prioritize motorized boat rescue; divert regional road traffic.');

      const text = `🛰️ <b>JATAYU RECONNAISSANCE FINDINGS</b>\n\n` +
        `<b>Region:</b> ${region}\n` +
        `<b>Inundated Surface:</b> <code>${floodArea}</code>\n` +
        `<b>Building Exposure:</b> ${buildings}\n` +
        `<b>Infrastructure Status:</b> ${infra}\n` +
        `<b>Recommended Action:</b> ${action}\n` +
        `<b>Detection Engine:</b> Dual-Band SAR Detector + YOLOv8x Building Footprint Inspector\n\n` +
        `<i>AI-assisted risk assessment. Verify conditions with official authorities.</i>`;

      const fingerprint = `recon-${payload.eventId || 'evt'}-${payload.floodExtentSqKm}-${payload.exposedBuildingsCount}`;
      return { text, fingerprint };
    }

    case 'analysis_completed': {
      const region = escapeHtml(payload.region || 'Disaster AOI');
      const status = escapeHtml(payload.completionStatus || 'Mission Accomplished');
      const imagery = escapeHtml(payload.imagerySource || 'Sentinel-1 C-SAR & Vantor Sub-Meter Optical');
      const errors = payload.modelErrors ? `\n<b>Model Limitations:</b> ${escapeHtml(payload.modelErrors)}` : '';

      const text = `✅ <b>JATAYU DISASTER ANALYSIS COMPLETE</b>\n\n` +
        `<b>Region:</b> ${region}\n` +
        `<b>Status:</b> <b>${status}</b>\n` +
        `<b>Observation Feeds:</b> ${imagery}\n` +
        `<b>Completed At:</b> ${timestamp}${errors}\n\n` +
        `<b>Command Center Feed:</b> Mission intelligence, exposure layers, and tactical maps synced.\n\n` +
        `<i>AI-assisted risk assessment. Verify conditions with official authorities.</i>`;

      const fingerprint = `complete-${payload.eventId || 'evt'}-${status}`;
      return { text, fingerprint };
    }

    case 'manual_alert': {
      const zone = escapeHtml(payload.zoneName || 'High Risk Sector');
      const priority = escapeHtml(payload.priority || 'P1');
      const score = payload.severityScore ?? 80;
      const agency = escapeHtml(payload.targetAgency || 'Civil Defense / NDRF');
      const pop = payload.exposedPopulation !== undefined ? `${payload.exposedPopulation.toLocaleString()} civilians` : 'Significant';
      const hospitals = payload.hospitalsCount !== undefined ? `${payload.hospitalsCount} hospitals affected` : 'Facility access monitored';
      const notes = escapeHtml(payload.tacticalNotes || 'Immediate emergency mobilization required.');

      const text = `🚨 <b>JATAYU TACTICAL WARNING DISPATCH</b>\n\n` +
        `<b>Target Zone:</b> ${zone} [<b>${priority}</b>]\n` +
        `<b>Severity Index:</b> <code>${score}/100</code>\n` +
        `<b>Responder Agency:</b> <b>${agency}</b>\n` +
        `<b>Civilian Exposure:</b> ${pop} | ${hospitals}\n\n` +
        `<b>Tactical Field Instructions:</b>\n<i>${notes}</i>\n\n` +
        `<b>Dispatched At:</b> ${timestamp}\n` +
        `<b>Channel:</b> Telegram Bot Direct Tactical Gateway\n\n` +
        `<i>AI-assisted risk assessment. Verify conditions with official authorities.</i>`;

      const fingerprint = `manual-${payload.alertId || payload.zoneName}-${score}-${payload.priority}`;
      return { text, fingerprint };
    }

    case 'test':
    default: {
      const notes = escapeHtml(payload.testNotes || 'Connection verification from JATAYU Command Center');
      const text = `🧪 <b>JATAYU TELEGRAM CONNECTION TEST</b>\n\n` +
        `<b>Status:</b> Telegram Bot Gateway Connected\n` +
        `<b>Time:</b> ${timestamp}\n` +
        `<b>Details:</b> ${notes}\n\n` +
        `<i>Emergency dispatch alerts will be routed to this channel.</i>`;

      const fingerprint = `test-${Date.now()}`;
      return { text, fingerprint };
    }
  }
}

/**
 * Verifies bot configuration via getMe
 */
export async function verifyTelegramBot(): Promise<{
  ok: boolean;
  botUsername?: string;
  botId?: number;
  error?: string;
  code?: string;
}> {
  const rawToken = process.env.TELEGRAM_BOT_TOKEN;
  if (!rawToken || !rawToken.trim()) {
    return {
      ok: false,
      code: 'MISSING_CREDENTIALS',
      error: 'TELEGRAM_BOT_TOKEN environment variable is not configured on the server.'
    };
  }

  const cleanToken = sanitizeBotToken(rawToken);
  if (!cleanToken) {
    return {
      ok: false,
      code: 'EMPTY_TOKEN',
      error: 'TELEGRAM_BOT_TOKEN is empty after stripping whitespace.'
    };
  }

  // Pre-validate token structure
  if (!/^\d+:/.test(cleanToken)) {
    return {
      ok: false,
      code: 'INVALID_TOKEN_FORMAT',
      error: "TELEGRAM_BOT_TOKEN format is invalid. Telegram bot tokens must start with numerical bot ID followed by a colon (e.g. 123456789:AA...). Do not include 'bot' prefix or '<>' brackets."
    };
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    const getMeUrl = `https://api.telegram.org/bot${cleanToken}/getMe`;

    const resp = await fetch(getMeUrl, {
      method: 'GET',
      signal: controller.signal
    });
    clearTimeout(timeout);

    const data = await resp.json();

    if (!data.ok) {
      if (data.error_code === 404 || resp.status === 404) {
        return {
          ok: false,
          code: 'TELEGRAM_404',
          error: "Telegram API returned 404 Not Found. Ensure TELEGRAM_BOT_TOKEN in Vercel settings contains only the token (e.g. 123456789:ABC...), without quotes, brackets, or the 'bot' prefix."
        };
      }
      if (data.error_code === 401 || resp.status === 401) {
        return {
          ok: false,
          code: 'TELEGRAM_401',
          error: 'Unauthorized: Telegram Bot Token is invalid or was revoked in @BotFather.'
        };
      }
      return {
        ok: false,
        code: `TELEGRAM_${data.error_code || resp.status}`,
        error: data.description || 'Telegram Bot API error.'
      };
    }

    return {
      ok: true,
      botUsername: data.result?.username ? `@${data.result.username}` : undefined,
      botId: data.result?.id
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Network error reaching Telegram API';
    return {
      ok: false,
      code: 'NETWORK_ERROR',
      error: `Failed to contact Telegram API: ${message}`
    };
  }
}

/**
 * Sends a structured alert to Telegram
 */
export async function sendTelegramAlert(payload: TelegramAlertPayload): Promise<TelegramResponse> {
  const rawToken = process.env.TELEGRAM_BOT_TOKEN;
  const rawChatId = process.env.TELEGRAM_CHAT_ID;

  const cleanToken = sanitizeBotToken(rawToken);
  const cleanChatId = sanitizeChatId(rawChatId);

  // Validate server configuration
  if (!cleanToken || !cleanChatId) {
    const missing: string[] = [];
    if (!cleanToken) missing.push('TELEGRAM_BOT_TOKEN');
    if (!cleanChatId) missing.push('TELEGRAM_CHAT_ID');
    return {
      ok: false,
      code: 'MISSING_CREDENTIALS',
      error: `Telegram credentials not configured on the server. Missing: ${missing.join(', ')}.`
    };
  }

  // Validate payload
  if (!payload || !payload.eventType) {
    return {
      ok: false,
      code: 'INVALID_PAYLOAD',
      error: 'Invalid payload: eventType is required.'
    };
  }

  const { text, fingerprint } = formatTelegramMessage(payload);
  const cacheKey = payload.fingerprint || fingerprint;

  // Deduplication check: unless it's a test event
  if (payload.eventType !== 'test') {
    const lastSent = deduplicationCache.get(cacheKey);
    const now = Date.now();
    if (lastSent && now - lastSent < COOLDOWN_MS) {
      return {
        ok: true,
        delivered: false,
        duplicate: true,
        message: 'Notification already delivered within cooldown window.',
        chatId: maskChatId(cleanChatId)
      };
    }
  }

  // Send to Telegram Bot API
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 9000);
    const sendMessageUrl = `https://api.telegram.org/bot${cleanToken}/sendMessage`;

    const resp = await fetch(sendMessageUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        chat_id: cleanChatId,
        text,
        parse_mode: 'HTML',
        disable_web_page_preview: true
      }),
      signal: controller.signal
    });

    clearTimeout(timeout);

    const data = await resp.json();

    if (!data.ok) {
      let sanitizedError = data.description || 'Telegram API request rejected';
      if (data.error_code === 404 || resp.status === 404) {
        sanitizedError = `Telegram API returned 404 Not Found. Verify TELEGRAM_BOT_TOKEN format in Vercel settings.`;
      } else if (data.error_code === 401 || resp.status === 401) {
        sanitizedError = 'Unauthorized: Telegram Bot Token is invalid or expired.';
      } else if (data.error_code === 400 && String(data.description).includes('chat not found')) {
        sanitizedError = `Bad Request: Chat ID (${maskChatId(cleanChatId)}) not found. For private chats, the user must first open Telegram, search your bot, and press /start.`;
      } else if (data.error_code === 403) {
        sanitizedError = `Forbidden: Bot is blocked by the user or lacks permission to post in Chat ID (${maskChatId(cleanChatId)}).`;
      }

      return {
        ok: false,
        code: `TELEGRAM_${data.error_code || resp.status || 'ERROR'}`,
        error: sanitizedError,
        chatId: maskChatId(cleanChatId)
      };
    }

    // Record success in deduplication cache
    if (payload.eventType !== 'test') {
      deduplicationCache.set(cacheKey, Date.now());
    }

    return {
      ok: true,
      delivered: true,
      messageId: data.result?.message_id,
      chatId: maskChatId(cleanChatId),
      message: 'Telegram alert successfully transmitted.'
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Network error reaching Telegram Bot API';
    return {
      ok: false,
      code: 'NETWORK_TIMEOUT',
      error: `Failed to contact Telegram API: ${message}`
    };
  }
}
