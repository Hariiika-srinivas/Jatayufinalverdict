/**
 * JATAYU — Vercel Serverless Function: /api/telegram-alert
 * Dispatches structured JATAYU emergency alerts to Telegram.
 * Fully self-contained. Works identically on Node.js Serverless and Web/Edge runtimes.
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

function escapeHtml(text: unknown): string {
  if (text === null || text === undefined) return '';
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

const alertDedupeCache = new Map<string, number>();
const COOLDOWN_MS = 180 * 1000;

function formatAlertMessage(payload: any): { text: string; fingerprint: string } {
  const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19) + ' UTC';
  const eventType = payload?.eventType || 'manual_alert';

  switch (eventType) {
    case 'predictive_risk': {
      const region = escapeHtml(payload.region || 'Active Monitoring Zone');
      const hazard = escapeHtml(payload.hazard || 'Hydrometeorological Flooding');
      const score = payload.riskScore ?? 0;
      const level = escapeHtml(payload.riskLevel || 'ELEVATED');
      const factors = payload.contributingFactors?.length
        ? payload.contributingFactors.map((f: any) => `• <b>${escapeHtml(f.name)}:</b> ${escapeHtml(f.impact)}`).join('\n')
        : '• 48h Precipitation accumulation exceeding drainage capacity\n• High soil saturation restricting infiltration';
      const droneStatus = payload.autoDroneTriggered
        ? 'AUTOMATICALLY TASKED & DEPLOYED'
        : 'Standby / Manual Authorization';
      const action = escapeHtml(payload.recommendedAction || 'Pre-position water rescue assets, prepare low-lying evacuation notices.');
      const freshness = escapeHtml(payload.dataFreshness || 'Open-Meteo NWP ECMWF Blend (Fresh) | Copernicus DEM 30m');

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

      return { text, fingerprint: `risk-${payload.eventId || 'evt'}-${payload.region}-${score}-${level}` };
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

      return { text, fingerprint: `drone-${payload.eventId || 'evt'}-${payload.region}-${status}` };
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

      return { text, fingerprint: `recon-${payload.eventId || 'evt'}-${payload.floodExtentSqKm}-${payload.exposedBuildingsCount}` };
    }

    case 'analysis_completed': {
      const region = escapeHtml(payload.region || 'Disaster AOI');
      const status = escapeHtml(payload.completionStatus || 'Mission Accomplished');
      const imagery = escapeHtml(payload.imagerySource || 'Sentinel-1 C-SAR & Vantor Sub-Meter Optical');

      const text = `✅ <b>JATAYU DISASTER ANALYSIS COMPLETE</b>\n\n` +
        `<b>Region:</b> ${region}\n` +
        `<b>Status:</b> <b>${status}</b>\n` +
        `<b>Observation Feeds:</b> ${imagery}\n` +
        `<b>Completed At:</b> ${timestamp}\n\n` +
        `<b>Command Center Feed:</b> Mission intelligence, exposure layers, and tactical maps synced.\n\n` +
        `<i>AI-assisted risk assessment. Verify conditions with official authorities.</i>`;

      return { text, fingerprint: `complete-${payload.eventId || 'evt'}-${status}` };
    }

    case 'manual_alert':
    default: {
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

      return { text, fingerprint: `manual-${payload.alertId || payload.zoneName}-${score}-${payload.priority}` };
    }
  }
}

async function handleTelegramAlert(payload: any) {
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

  if (!payload || !payload.eventType) {
    return {
      status: 400,
      data: { ok: false, code: 'INVALID_PAYLOAD', error: 'Invalid payload: eventType is required.' }
    };
  }

  const { text, fingerprint } = formatAlertMessage(payload);
  const cacheKey = payload.fingerprint || fingerprint;

  // Deduplication check
  if (payload.eventType !== 'test') {
    const lastSent = alertDedupeCache.get(cacheKey);
    const now = Date.now();
    if (lastSent && now - lastSent < COOLDOWN_MS) {
      return {
        status: 200,
        data: {
          ok: true,
          delivered: false,
          duplicate: true,
          message: 'Notification already delivered within cooldown window.',
          chatId: maskChatId(chatId)
        }
      };
    }
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 12000);

  try {
    const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: 'HTML',
        disable_web_page_preview: true
      }),
      signal: controller.signal
    });

    const resText = await response.text();
    let data: any;
    try {
      data = JSON.parse(resText);
    } catch {
      throw new Error(`Telegram returned non-JSON response (HTTP ${response.status})`);
    }

    if (!response.ok || !data.ok) {
      let desc = data.description || `Telegram request failed (HTTP ${response.status})`;
      if (String(desc).includes('chat not found')) {
        desc = `Chat ID (${maskChatId(chatId)}) not found. For private chats, the recipient must open Telegram and press /start.`;
      }
      return {
        status: 400,
        data: {
          ok: false,
          code: `TELEGRAM_${data.error_code || response.status}`,
          error: desc,
          chatId: maskChatId(chatId)
        }
      };
    }

    if (payload.eventType !== 'test') {
      alertDedupeCache.set(cacheKey, Date.now());
    }

    return {
      status: 200,
      data: {
        ok: true,
        delivered: true,
        messageId: data.result?.message_id,
        chatId: maskChatId(chatId),
        message: 'Telegram alert successfully transmitted.'
      }
    };
  } catch (err: any) {
    return {
      status: 500,
      data: { ok: false, code: 'NETWORK_TIMEOUT', error: err?.message || 'Network error reaching Telegram API' }
    };
  } finally {
    clearTimeout(timeoutId);
  }
}

// Node.js Serverless runtime export
export default async function handler(req: any, res: any) {
  if (res && typeof res.setHeader === 'function') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  }

  if (req && req.method === 'OPTIONS') {
    if (res && typeof res.status === 'function') return res.status(200).end();
    return new Response(null, { status: 200 });
  }

  if (req && req.method !== 'POST') {
    const mErr = { ok: false, error: 'Method not allowed. Use POST.' };
    if (res && typeof res.status === 'function') return res.status(405).json(mErr);
    return Response.json(mErr, { status: 405 });
  }

  try {
    const rawBody = req.body;
    const payload = typeof rawBody === 'string' ? JSON.parse(rawBody) : rawBody;
    const result = await handleTelegramAlert(payload);
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

// Web Standard / Edge runtime export
export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const result = await handleTelegramAlert(payload);
    return Response.json(result.data, {
      status: result.status,
      headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' }
    });
  } catch (e: any) {
    return Response.json({ ok: false, error: e?.message || 'Internal Server Error' }, { status: 500 });
  }
}
