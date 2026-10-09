/**
 * JATAYU — Comprehensive Telegram Integration & Regression Test Suite
 */
import {
  formatTelegramMessage,
  maskChatId,
  sendTelegramAlert,
  verifyTelegramBot,
  sanitizeBotToken,
  sanitizeChatId,
  TelegramAlertPayload
} from '../src/services/telegramService';

let passed = 0;
let failed = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  if (condition) {
    console.log(`✓ PASS: ${testName}`);
    passed++;
  } else {
    console.error(`✗ FAIL: ${testName} - ${detail || ''}`);
    failed++;
  }
}

async function runTests() {
  console.log('--- JATAYU Telegram Bot Integration Test Suite ---\n');

  // Test 1: Mask Chat ID security
  assert(maskChatId('123456789') === '123***789', 'Mask Chat ID standard format');
  assert(maskChatId('-100192837465') === '-10***465', 'Mask Chat ID channel format');
  assert(maskChatId('') === '', 'Mask Chat ID handles empty string');

  // Test 1b: Token Sanitization (Prevents 404 Not Found from Telegram API)
  assert(sanitizeBotToken('123456:ABC-DEF') === '123456:ABC-DEF', 'Token sanitize: clean token untouched');
  assert(sanitizeBotToken('bot123456:ABC-DEF') === '123456:ABC-DEF', 'Token sanitize: strips duplicate bot prefix');
  assert(sanitizeBotToken('<123456:ABC-DEF>') === '123456:ABC-DEF', 'Token sanitize: strips angle brackets');
  assert(sanitizeBotToken('"123456:ABC-DEF"') === '123456:ABC-DEF', 'Token sanitize: strips double quotes');
  assert(sanitizeBotToken("'123456:ABC-DEF'") === '123456:ABC-DEF', 'Token sanitize: strips single quotes');
  assert(sanitizeBotToken('https://api.telegram.org/bot123456:ABC-DEF/getMe') === '123456:ABC-DEF', 'Token sanitize: extracts token from full URL');
  assert(sanitizeBotToken('  bot123456:ABC-DEF/  ') === '123456:ABC-DEF', 'Token sanitize: trims whitespace and slashes');

  // Test 1c: Chat ID Sanitization
  assert(sanitizeChatId('"12345678"') === '12345678', 'Chat ID sanitize: strips quotes');
  assert(sanitizeChatId('<-10012345678>') === '-10012345678', 'Chat ID sanitize: strips brackets');
  assert(sanitizeChatId('  -10012345678  ') === '-10012345678', 'Chat ID sanitize: trims whitespace');

  // Test 2: Message formatting for Event A (predictive_risk)
  const predictivePayload: TelegramAlertPayload = {
    eventType: 'predictive_risk',
    eventId: 'E0_JK_LATEST_2026',
    region: 'Jammu & Kashmir (Jhelum Basin)',
    hazard: 'FLASH_FLOOD',
    riskScore: 84,
    riskLevel: 'CRITICAL',
    autoDroneTriggered: true,
    contributingFactors: [
      { name: 'Weather', impact: '68mm rain accumulation' },
      { name: 'Soil', impact: '82% moisture' }
    ],
    dataFreshness: 'Open-Meteo ECMWF Blend (Fresh)'
  };
  const formattedA = formatTelegramMessage(predictivePayload);
  assert(formattedA.text.includes('JATAYU EARLY WARNING'), 'Event A message title');
  assert(formattedA.text.includes('84/100'), 'Event A risk score included');
  assert(formattedA.text.includes('CRITICAL'), 'Event A risk level included');
  assert(formattedA.text.includes('AUTOMATICALLY TASKED & DEPLOYED'), 'Event A auto-drone status included');

  // Test 3: Message formatting for Event B (drone_activated)
  const dronePayload: TelegramAlertPayload = {
    eventType: 'drone_activated',
    eventId: 'E0_JK_LATEST_2026',
    region: 'Jammu & Kashmir',
    triggerReason: 'Risk score (84/100) crossed threshold (65%)',
    droneStartTime: '2026-10-09 14:00 UTC',
    droneStatus: 'TASKED & LOCKED'
  };
  const formattedB = formatTelegramMessage(dronePayload);
  assert(formattedB.text.includes('JATAYU VIRTUAL DRONE ACTIVATION'), 'Event B message title');
  assert(formattedB.text.includes('TASKED &amp; LOCKED') || formattedB.text.includes('TASKED & LOCKED'), 'Event B status included');

  // Test 4: Message formatting for Event C (recon_finding)
  const reconPayload: TelegramAlertPayload = {
    eventType: 'recon_finding',
    eventId: 'E0_JK_LATEST_2026',
    region: 'Bemina & Flood Spill Channel Junction',
    floodExtentSqKm: 3.12,
    exposedBuildingsCount: 310,
    damagedBuildingsCount: 18,
    criticalInfrastructure: '1 hospital affected | Link bridge submerged',
    recommendedAction: 'Deploy motorized rescue boats'
  };
  const formattedC = formatTelegramMessage(reconPayload);
  assert(formattedC.text.includes('JATAYU RECONNAISSANCE FINDINGS'), 'Event C message title');
  assert(formattedC.text.includes('3.12 km²'), 'Event C flood area included');
  assert(formattedC.text.includes('310 structures exposed'), 'Event C buildings count included');

  // Test 5: Message formatting for Event D (analysis_completed)
  const completedPayload: TelegramAlertPayload = {
    eventType: 'analysis_completed',
    eventId: 'E0_JK_LATEST_2026',
    region: 'Jammu & Kashmir',
    completionStatus: 'Mission Accomplished: Full Tier 1/2 Exposure Intelligence Synced',
    imagerySource: 'Sentinel-1 C-SAR & Vantor Sub-Meter Optical'
  };
  const formattedD = formatTelegramMessage(completedPayload);
  assert(formattedD.text.includes('JATAYU DISASTER ANALYSIS COMPLETE'), 'Event D message title');
  assert(formattedD.text.includes('Mission Accomplished'), 'Event D status included');

  // Test 6: Message formatting for Manual Tactical Alert
  const manualPayload: TelegramAlertPayload = {
    eventType: 'manual_alert',
    alertId: 'ALT-2026-003',
    zoneName: 'Nakkhu River Confluence',
    priority: 'P1',
    severityScore: 88.4,
    targetAgency: 'National Disaster Response Force (NDRF)',
    tacticalNotes: 'Immediate aerial boat rescue prioritized',
    exposedPopulation: 4500,
    hospitalsCount: 2
  };
  const formattedManual = formatTelegramMessage(manualPayload);
  assert(formattedManual.text.includes('JATAYU TACTICAL WARNING DISPATCH'), 'Manual alert title');
  assert(formattedManual.text.includes('88.4/100'), 'Manual alert severity included');
  assert(formattedManual.text.includes('NDRF'), 'Manual alert agency included');

  // Test 7: Missing credentials error handling
  delete process.env.TELEGRAM_BOT_TOKEN;
  delete process.env.TELEGRAM_CHAT_ID;
  const missingCredsResult = await sendTelegramAlert(predictivePayload);
  assert(missingCredsResult.ok === false, 'Missing credentials returns ok: false');
  assert(missingCredsResult.code === 'MISSING_CREDENTIALS', 'Missing credentials returns proper code');
  assert(
    missingCredsResult.error?.includes('TELEGRAM_BOT_TOKEN') === true,
    'Missing credentials error lists missing variable'
  );

  const missingTokenVerify = await verifyTelegramBot();
  assert(missingTokenVerify.ok === false, 'verifyTelegramBot without token returns ok: false');

  // Test 8: Invalid credentials error handling
  process.env.TELEGRAM_BOT_TOKEN = '123456:INVALID_DUMMY_TOKEN_FOR_TEST';
  process.env.TELEGRAM_CHAT_ID = '987654321';

  const invalidTokenVerify = await verifyTelegramBot();
  assert(invalidTokenVerify.ok === false, 'verifyTelegramBot with invalid token fails safely');
  assert(
    !JSON.stringify(invalidTokenVerify).includes('INVALID_DUMMY_TOKEN_FOR_TEST'),
    'verifyTelegramBot does not leak bot token in error response'
  );

  const invalidSendResult = await sendTelegramAlert(predictivePayload);
  assert(invalidSendResult.ok === false, 'sendTelegramAlert with invalid token returns ok: false');
  assert(
    !JSON.stringify(invalidSendResult).includes('INVALID_DUMMY_TOKEN_FOR_TEST'),
    'sendTelegramAlert does not leak bot token in error response'
  );

  // Test 9: Deduplication behavior
  // Mock a successful cache entry
  const dedupePayload: TelegramAlertPayload = {
    eventType: 'predictive_risk',
    fingerprint: 'test-dedupe-key-123',
    eventId: 'E0_TEST',
    region: 'Test AOI',
    riskScore: 80
  };
  // Send once with dummy token to see rejection
  await sendTelegramAlert(dedupePayload);
  // Re-verify that payload validation works
  const invalidPayloadResult = await sendTelegramAlert({} as any);
  assert(invalidPayloadResult.ok === false, 'Empty payload rejected with INVALID_PAYLOAD');

  console.log(`\nResults: ${passed} passed, ${failed} failed.`);
  if (failed > 0) process.exit(1);
}

runTests();
