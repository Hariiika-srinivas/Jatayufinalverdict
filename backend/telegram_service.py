"""
JATAYU — Python Telegram Alert Integration Module
Handles secure Telegram Bot API operations, credentials validation,
message formatting, and deduplication for Python / FastAPI / Flask backends.
Uses urllib.request (zero external dependency) with requests fallback.
"""

import os
import re
import html
import time
import json
import urllib.request
import urllib.error
from typing import Dict, Any, Optional, Tuple

# Deduplication cache: fingerprint -> timestamp
_DEDUPLICATION_CACHE: Dict[str, float] = {}
COOLDOWN_SECONDS = 180.0


def sanitize_bot_token(raw_token: Optional[str]) -> str:
    """
    Sanitizes raw token to extract pure bot token.
    Strips quotes, angle brackets, leading 'bot' prefix, full URL prefixes, and whitespace.
    """
    if not raw_token:
        return ""
    token = raw_token.strip()

    if (token.startswith('"') and token.endswith('"')) or (token.startswith("'") and token.endswith("'")):
        token = token[1:-1].strip()

    if token.startswith("<") and token.endswith(">"):
        token = token[1:-1].strip()

    url_match = re.search(r'(?:https?://)?api\.telegram\.org/bot([^\s/]+)', token, re.IGNORECASE)
    if url_match:
        token = url_match.group(1).strip()

    if token.lower().startswith("bot"):
        remainder = token[3:].strip()
        if re.match(r'^\d+:', remainder):
            token = remainder

    return token.rstrip("/").strip()


def sanitize_chat_id(raw_chat_id: Optional[str]) -> str:
    """
    Sanitizes chat ID string.
    """
    if not raw_chat_id:
        return ""
    chat_id = str(raw_chat_id).strip()
    if (chat_id.startswith('"') and chat_id.endswith('"')) or (chat_id.startswith("'") and chat_id.endswith("'")):
        chat_id = chat_id[1:-1].strip()
    if chat_id.startswith("<") and chat_id.endswith(">"):
        chat_id = chat_id[1:-1].strip()
    return chat_id.strip()


def mask_chat_id(chat_id: str) -> str:
    """
    Masks chat ID for display in UI or logs without exposing full ID.
    """
    if not chat_id:
        return ""
    s = str(chat_id).strip()
    if len(s) <= 4:
        return "***"
    return s[:3] + "***" + s[-3:]


def format_telegram_message(payload: Dict[str, Any]) -> Tuple[str, str]:
    """
    Formats structured alert into clear, formatted HTML message.
    """
    event_type = payload.get("event_type") or payload.get("eventType") or "manual_alert"
    now_utc = time.strftime("%Y-%m-%d %H:%M:%S UTC", time.gmtime())

    if event_type == "predictive_risk":
        region = html.escape(payload.get("region") or "Active Monitoring Zone")
        hazard = html.escape(payload.get("hazard") or "Hydrometeorological Flooding")
        score = payload.get("risk_score") if payload.get("risk_score") is not None else payload.get("riskScore", 75)
        level = html.escape(payload.get("risk_level") or payload.get("riskLevel") or "HIGH")
        factors = payload.get("contributing_factors") or payload.get("contributingFactors") or []
        factors_str = "\n".join([f"• <b>{html.escape(f.get('name', ''))}:</b> {html.escape(f.get('impact', ''))}" for f in factors]) if factors else "• 48h Precipitation accumulation exceeding drainage capacity\n• High soil saturation restricting infiltration"
        action = html.escape(payload.get("recommended_action") or payload.get("recommendedAction") or "Pre-position water rescue assets, prepare low-lying evacuation notices.")
        freshness = html.escape(payload.get("data_freshness") or payload.get("dataFreshness") or "Open-Meteo NWP ECMWF Blend (Fresh)")

        text = (
            f"🚨 <b>JATAYU EARLY WARNING</b>\n\n"
            f"<b>Hazard:</b> {hazard}\n"
            f"<b>Region:</b> {region}\n"
            f"<b>Risk Score:</b> <code>{score}/100</code>\n"
            f"<b>Risk Level:</b> <b>{level}</b>\n\n"
            f"<b>Contributing Factors:</b>\n{factors_str}\n\n"
            f"<b>Data Updated:</b> {now_utc}\n"
            f"<b>Recommended Action:</b> {action}\n\n"
            f"<b>Data Status:</b> {freshness}\n\n"
            f"<i>AI-assisted risk assessment. Verify conditions with official authorities.</i>"
        )
        fingerprint = f"risk-{payload.get('event_id', 'evt')}-{region}-{score}-{level}"
        return text, fingerprint

    elif event_type == "drone_activated":
        region = html.escape(payload.get("region") or "Disaster AOI")
        reason = html.escape(payload.get("trigger_reason") or payload.get("triggerReason") or "Risk threshold crossed autonomous trigger criteria")
        status = html.escape(payload.get("drone_status") or payload.get("droneStatus") or "TASKED & LOCKED")

        text = (
            f"🚁 <b>JATAYU VIRTUAL DRONE ACTIVATION</b>\n\n"
            f"<b>Region:</b> {region}\n"
            f"<b>Trigger Reason:</b> {reason}\n"
            f"<b>Tasking Time:</b> {now_utc}\n"
            f"<b>Current Status:</b> <b>{status}</b>\n\n"
            f"<b>Protocol:</b> Multi-Catalog STAC Federation (Sentinel-1 SAR, NISAR L-band, Vantor VHR Optical)\n"
            f"<b>Objective:</b> Autonomous surface water delineation and building exposure inspection\n\n"
            f"<i>AI-assisted risk assessment. Verify conditions with official authorities.</i>"
        )
        fingerprint = f"drone-{payload.get('event_id', 'evt')}-{region}-{status}"
        return text, fingerprint

    elif event_type == "recon_finding":
        region = html.escape(payload.get("region") or "Disaster AOI")
        flood_area = payload.get("flood_extent_sqkm") or payload.get("floodExtentSqKm") or "Calculated in AOI"
        buildings = payload.get("exposed_buildings_count") or payload.get("exposedBuildingsCount") or 0
        damaged = payload.get("damaged_buildings_count") or payload.get("damagedBuildingsCount") or 0
        infra = html.escape(payload.get("critical_infrastructure") or payload.get("criticalInfrastructure") or "Link roads inundated")
        action = html.escape(payload.get("recommended_action") or payload.get("recommendedAction") or "Prioritize boat rescue; divert road traffic.")

        text = (
            f"🛰️ <b>JATAYU RECONNAISSANCE FINDINGS</b>\n\n"
            f"<b>Region:</b> {region}\n"
            f"<b>Inundated Surface:</b> <code>{flood_area} km²</code>\n"
            f"<b>Building Exposure:</b> {buildings} structures ({damaged} compromised)\n"
            f"<b>Infrastructure Status:</b> {infra}\n"
            f"<b>Recommended Action:</b> {action}\n"
            f"<b>Detection Engine:</b> Dual-Band SAR Detector + YOLOv8x Building Footprint Inspector\n\n"
            f"<i>AI-assisted risk assessment. Verify conditions with official authorities.</i>"
        )
        fingerprint = f"recon-{payload.get('event_id', 'evt')}-{flood_area}-{buildings}"
        return text, fingerprint

    elif event_type == "analysis_completed":
        region = html.escape(payload.get("region") or "Disaster AOI")
        status = html.escape(payload.get("completion_status") or payload.get("completionStatus") or "Mission Accomplished")
        imagery = html.escape(payload.get("imagery_source") or payload.get("imagerySource") or "Sentinel-1 C-SAR & Vantor Optical")

        text = (
            f"✅ <b>JATAYU DISASTER ANALYSIS COMPLETE</b>\n\n"
            f"<b>Region:</b> {region}\n"
            f"<b>Status:</b> <b>{status}</b>\n"
            f"<b>Observation Feeds:</b> {imagery}\n"
            f"<b>Completed At:</b> {now_utc}\n\n"
            f"<b>Command Center Feed:</b> Mission intelligence, exposure layers, and tactical maps synced.\n\n"
            f"<i>AI-assisted risk assessment. Verify conditions with official authorities.</i>"
        )
        fingerprint = f"complete-{payload.get('event_id', 'evt')}-{status}"
        return text, fingerprint

    elif event_type == "manual_alert":
        zone = html.escape(payload.get("zone_name") or payload.get("zoneName") or "High Risk Sector")
        priority = html.escape(payload.get("priority") or "P1")
        score = payload.get("severity_score") or payload.get("severityScore") or 80
        agency = html.escape(payload.get("target_agency") or payload.get("targetAgency") or "National Disaster Response Force (NDRF)")
        notes = html.escape(payload.get("tactical_notes") or payload.get("tacticalNotes") or "Immediate emergency mobilization required.")
        pop = payload.get("exposed_population") or payload.get("exposedPopulation") or 3500

        text = (
            f"🚨 <b>JATAYU TACTICAL WARNING DISPATCH</b>\n\n"
            f"<b>Target Zone:</b> {zone} [<b>{priority}</b>]\n"
            f"<b>Severity Index:</b> <code>{score}/100</code>\n"
            f"<b>Responder Agency:</b> <b>{agency}</b>\n"
            f"<b>Civilian Exposure:</b> {pop} civilians\n\n"
            f"<b>Tactical Field Instructions:</b>\n<i>${notes}</i>\n\n"
            f"<b>Dispatched At:</b> {now_utc}\n"
            f"<b>Channel:</b> Telegram Bot Direct Tactical Gateway\n\n"
            f"<i>AI-assisted risk assessment. Verify conditions with official authorities.</i>"
        )
        fingerprint = f"manual-{payload.get('alert_id', zone)}-{score}-{priority}"
        return text, fingerprint

    else:
        notes = html.escape(payload.get("test_notes") or payload.get("testNotes") or "Connection verification from JATAYU Command Center")
        text = (
            f"🧪 <b>JATAYU TELEGRAM CONNECTION TEST</b>\n\n"
            f"<b>Status:</b> Telegram Bot Gateway Connected\n"
            f"<b>Time:</b> {now_utc}\n"
            f"<b>Details:</b> {notes}\n\n"
            f"<i>Emergency dispatch alerts will be routed to this channel.</i>"
        )
        fingerprint = f"test-{time.time()}"
        return text, fingerprint


def verify_telegram_bot() -> Dict[str, Any]:
    """
    Verifies bot token with getMe without exposing token.
    Uses standard library urllib (zero dependencies).
    """
    raw_token = os.environ.get("TELEGRAM_BOT_TOKEN")
    if not raw_token or not raw_token.strip():
        return {
            "ok": False,
            "code": "MISSING_CREDENTIALS",
            "error": "TELEGRAM_BOT_TOKEN environment variable is not configured on the server."
        }

    clean_token = sanitize_bot_token(raw_token)
    if not clean_token:
        return {
            "ok": False,
            "code": "EMPTY_TOKEN",
            "error": "TELEGRAM_BOT_TOKEN is empty after stripping whitespace."
        }

    if not re.match(r'^\d+:', clean_token):
        return {
            "ok": False,
            "code": "INVALID_TOKEN_FORMAT",
            "error": "TELEGRAM_BOT_TOKEN format is invalid. Telegram bot tokens must start with numerical bot ID followed by a colon (e.g. 123456789:AA...). Do not include 'bot' prefix or '<>' brackets."
        }

    url = f"https://api.telegram.org/bot{clean_token}/getMe"
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "JATAYU-Engine/2.0"})
        with urllib.request.urlopen(req, timeout=8.0) as resp:
            data = json.loads(resp.read().decode())

        if not data.get("ok"):
            return {
                "ok": False,
                "code": "TELEGRAM_ERROR",
                "error": data.get("description") or "Telegram Bot API error."
            }

        result = data.get("result", {})
        username = f"@{result['username']}" if result.get("username") else None
        return {
            "ok": True,
            "bot_username": username,
            "bot_id": result.get("id"),
            "bot_name": result.get("first_name")
        }
    except urllib.error.HTTPError as e:
        try:
            data = json.loads(e.read().decode())
            desc = data.get("description", e.reason)
        except Exception:
            data = {}
            desc = e.reason

        if e.code == 404:
            return {
                "ok": False,
                "code": "TELEGRAM_404",
                "error": "Telegram API returned 404 Not Found. Ensure TELEGRAM_BOT_TOKEN contains only the token (e.g. 123456789:ABC...), without quotes, brackets, or the 'bot' prefix."
            }
        elif e.code == 401:
            return {
                "ok": False,
                "code": "TELEGRAM_401",
                "error": "Unauthorized: Telegram Bot Token is invalid or was revoked in @BotFather."
            }
        return {
            "ok": False,
            "code": f"TELEGRAM_{e.code}",
            "error": desc
        }
    except Exception as e:
        return {
            "ok": False,
            "code": "NETWORK_ERROR",
            "error": f"Failed to contact Telegram API: {str(e)}"
        }


def send_telegram_alert(payload: Dict[str, Any]) -> Dict[str, Any]:
    """
    Sends structured alert to configured chat ID using standard library urllib.
    """
    raw_token = os.environ.get("TELEGRAM_BOT_TOKEN")
    raw_chat = os.environ.get("TELEGRAM_CHAT_ID")

    clean_token = sanitize_bot_token(raw_token)
    clean_chat = sanitize_chat_id(raw_chat)

    if not clean_token or not clean_chat:
        missing = []
        if not clean_token:
            missing.append("TELEGRAM_BOT_TOKEN")
        if not clean_chat:
            missing.append("TELEGRAM_CHAT_ID")
        return {
            "ok": False,
            "code": "MISSING_CREDENTIALS",
            "error": f"Telegram credentials not configured on the server. Missing: {', '.join(missing)}."
        }

    text, fingerprint = format_telegram_message(payload)
    cache_key = payload.get("fingerprint") or fingerprint

    # Deduplication check
    event_type = payload.get("event_type") or payload.get("eventType")
    if event_type != "test":
        last_sent = _DEDUPLICATION_CACHE.get(cache_key)
        now = time.time()
        if last_sent and (now - last_sent) < COOLDOWN_SECONDS:
            return {
                "ok": True,
                "delivered": False,
                "duplicate": True,
                "message": "Notification already delivered within cooldown window.",
                "chat_id": mask_chat_id(clean_chat)
            }

    url = f"https://api.telegram.org/bot{clean_token}/sendMessage"
    body_data = json.dumps({
        "chat_id": clean_chat,
        "text": text,
        "parse_mode": "HTML",
        "disable_web_page_preview": True
    }).encode("utf-8")

    try:
        req = urllib.request.Request(
            url,
            data=body_data,
            headers={"Content-Type": "application/json", "User-Agent": "JATAYU-Engine/2.0"},
            method="POST"
        )
        with urllib.request.urlopen(req, timeout=9.0) as resp:
            data = json.loads(resp.read().decode())

        if not data.get("ok"):
            return {
                "ok": False,
                "code": "TELEGRAM_REJECTED",
                "error": data.get("description") or "Telegram request rejected",
                "chat_id": mask_chat_id(clean_chat)
            }

        if event_type != "test":
            _DEDUPLICATION_CACHE[cache_key] = time.time()

        return {
            "ok": True,
            "delivered": True,
            "message_id": data.get("result", {}).get("message_id"),
            "chat_id": mask_chat_id(clean_chat),
            "message": "Telegram alert successfully transmitted."
        }
    except urllib.error.HTTPError as e:
        try:
            data = json.loads(e.read().decode())
            desc = data.get("description", e.reason)
        except Exception:
            desc = e.reason

        sanitized = desc
        if e.code == 404:
            sanitized = "Telegram API returned 404 Not Found. Verify TELEGRAM_BOT_TOKEN format."
        elif e.code == 401:
            sanitized = "Unauthorized: Telegram Bot Token is invalid or expired."
        elif e.code == 400 and "chat not found" in str(desc).lower():
            sanitized = f"Bad Request: Chat ID ({mask_chat_id(clean_chat)}) not found. For private chats, the recipient must first open Telegram, find the bot, and send /start."
        elif e.code == 403:
            sanitized = f"Forbidden: Bot is blocked or lacks permission to post in Chat ID ({mask_chat_id(clean_chat)})."

        return {
            "ok": False,
            "code": f"TELEGRAM_{e.code}",
            "error": sanitized,
            "chat_id": mask_chat_id(clean_chat)
        }
    except Exception as e:
        return {
            "ok": False,
            "code": "NETWORK_TIMEOUT",
            "error": f"Failed to contact Telegram Bot API: {str(e)}"
        }
