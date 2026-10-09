"""
JATAYU — Production FastAPI Server
Provides high-performance asynchronous endpoints for disaster reconnaissance,
model routing, and secure Telegram emergency alert dispatching.
"""

import os
import time
from typing import Dict, Any, Optional, List
from fastapi import FastAPI, HTTPException, Request, Response, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from telegram_service import (
    verify_telegram_bot,
    send_telegram_alert,
    mask_chat_id,
    sanitize_bot_token,
    sanitize_chat_id
)

app = FastAPI(
    title="JATAYU Disaster Intelligence Platform",
    description="Autonomous Reconnaissance, Geospatial Exposure Modeling & Emergency Alert Gateway",
    version="2.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class TelegramAlertRequest(BaseModel):
    eventType: str = Field(..., description="Alert type: predictive_risk, drone_activated, recon_finding, analysis_completed, manual_alert, test")
    eventId: Optional[str] = None
    alertId: Optional[str] = None
    region: Optional[str] = None
    hazard: Optional[str] = None
    riskScore: Optional[float] = None
    riskLevel: Optional[str] = None
    zoneName: Optional[str] = None
    priority: Optional[str] = None
    severityScore: Optional[float] = None
    targetAgency: Optional[str] = None
    tacticalNotes: Optional[str] = None
    exposedPopulation: Optional[int] = None
    floodExtentSqKm: Optional[float] = None
    exposedBuildingsCount: Optional[int] = None
    damagedBuildingsCount: Optional[int] = None
    criticalInfrastructure: Optional[str] = None
    recommendedAction: Optional[str] = None
    completionStatus: Optional[str] = None
    imagerySource: Optional[str] = None
    testNotes: Optional[str] = None
    autoDroneTriggered: Optional[bool] = None
    dataFreshness: Optional[str] = None


@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "JATAYU Disaster Intelligence Engine (FastAPI)",
        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "telegram_gateway": {
            "configured": bool(os.environ.get("TELEGRAM_BOT_TOKEN") and os.environ.get("TELEGRAM_CHAT_ID")),
            "chat_id_masked": mask_chat_id(os.environ.get("TELEGRAM_CHAT_ID", ""))
        }
    }


@app.post("/api/telegram-alert")
def dispatch_telegram_alert(payload: TelegramAlertRequest, response: Response):
    result = send_telegram_alert(payload.dict(exclude_none=True))
    if not result.get("ok"):
        if result.get("code") == "MISSING_CREDENTIALS":
            response.status_code = status.HTTP_500_INTERNAL_SERVER_ERROR
        else:
            response.status_code = status.HTTP_400_BAD_REQUEST
    return result


@app.get("/api/telegram-test")
@app.post("/api/telegram-test")
def test_telegram_connection(response: Response):
    bot_check = verify_telegram_bot()
    if not bot_check.get("ok"):
        response.status_code = status.HTTP_401_UNAUTHORIZED
        return {
            "ok": False,
            "bot_verified": False,
            "delivered": False,
            "code": bot_check.get("code", "INVALID_TOKEN"),
            "error": f"Telegram bot verification failed: {bot_check.get('error')}"
        }

    chat_id = os.environ.get("TELEGRAM_CHAT_ID", "").strip()
    send_result = send_telegram_alert({
        "eventType": "test",
        "testNotes": f"Direct connection verification requested from JATAYU FastAPI Gateway. Bot: {bot_check.get('bot_username', 'Active')}"
    })

    if not send_result.get("ok"):
        response.status_code = status.HTTP_400_BAD_REQUEST
        return {
            "ok": False,
            "bot_verified": True,
            "delivered": False,
            "bot_username": bot_check.get("bot_username"),
            "chat_id": mask_chat_id(chat_id),
            "error": f"Bot verified ({bot_check.get('bot_username')}), but message delivery failed: {send_result.get('error')}"
        }

    return {
        "ok": True,
        "bot_verified": True,
        "delivered": True,
        "bot_username": bot_check.get("bot_username"),
        "chat_id": mask_chat_id(chat_id),
        "message_id": send_result.get("message_id"),
        "message": f"Connection verified! Test alert delivered to Chat ID {mask_chat_id(chat_id)} via {bot_check.get('bot_username')}."
    }


if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("main_fastapi:app", host="0.0.0.0", port=port, reload=False)
