"""
JATAYU — Production Geospatial Inference Server
Connects Frontend UI to NASA-IBM Prithvi EO 2.0 Flood Model & Optical Building Pipeline.
"""

import os
import io
import json
import uuid
import datetime
from typing import Dict, Any
from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
from werkzeug.utils import secure_filename
import numpy as np

# Import specialized geospatial modules
from inference_prithvi import run_prithvi_flood_inference, validate_input_geotiff
from building_detector import BuildingFootprintPipeline, calculate_flood_exposure

app = Flask(__name__)
CORS(app)

UPLOAD_FOLDER = os.path.join(os.path.dirname(__file__), "uploads")
OUTPUT_FOLDER = os.path.join(os.path.dirname(__file__), "outputs")
SAMPLES_FOLDER = os.path.join(os.path.dirname(__file__), "..", "examples")

os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(OUTPUT_FOLDER, exist_ok=True)
os.makedirs(SAMPLES_FOLDER, exist_ok=True)

# Initialize building detector pipeline
building_pipeline = BuildingFootprintPipeline()


@app.route("/health", methods=["GET"])
def health_check():
    """
    Returns system status, active models, device capabilities, and checkpoint status.
    """
    checkpoint_path = os.path.join(os.path.dirname(__file__), "..", "models", "Prithvi-EO-V2-300M-TL-Sen1Floods11.pt")
    checkpoint_available = os.path.exists(checkpoint_path)

    return jsonify({
        "status": "healthy",
        "service": "JATAYU Geospatial Disaster Intelligence Engine",
        "timestamp": datetime.datetime.utcnow().isoformat() + "Z",
        "models": {
            "prithvi_flood_segmentation": {
                "name": "Prithvi-EO-2.0-300M-TL-Sen1Floods11",
                "organization": "IBM / NASA-IMPACT",
                "backbone": "ViT-300M with Temporal-Location Embeddings",
                "decoder": "UperNet Decoder (2 classes)",
                "checkpoint_loaded": checkpoint_available,
                "input_bands": ["BLUE", "GREEN", "RED", "NIR_NARROW", "SWIR_1", "SWIR_2"],
                "target": "Surface Water & Flood Extent Segmentation"
            },
            "building_footprint_detector": {
                "name": "High-Resolution Optical Building Detector",
                "status": "active",
                "input_format": "RGB Optical High-Res Imagery",
                "structural_damage_assessment": "Not assessed — compatible damage model required"
            }
        },
        "hardware": {
            "device": "cpu",
            "environment": "Linux Geospatial Runtime"
        }
    })


@app.route("/api/sample-datasets", methods=["GET"])
def get_sample_datasets():
    """
    Returns verified official benchmark datasets available for immediate testing.
    """
    samples = [
        {
            "id": "india-assam-sen1floods11",
            "name": "India — Assam Brahmaputra Flood (Sen1Floods11)",
            "file": "India_900498_S2Hand.tif",
            "type": "Sentinel-2 L1C Multispectral (13 bands, 10m GSD)",
            "location": "Assam, India (26.74°N, 93.75°E)",
            "sensor": "Sentinel-2 MSI",
            "bands_count": 13,
            "compatible_models": ["Prithvi-EO-2.0-300M-TL-Sen1Floods11", "Combined Exposure Pipeline"],
            "event": "Monsoon Riverine Flooding"
        },
        {
            "id": "spain-ebro-sen1floods11",
            "name": "Spain — Ebro Basin Inundation",
            "file": "Spain_7370579_S2Hand.tif",
            "type": "Sentinel-2 L1C Multispectral (13 bands, 10m GSD)",
            "location": "Zaragoza, Spain (41.65°N, 0.88°W)",
            "sensor": "Sentinel-2 MSI",
            "bands_count": 13,
            "compatible_models": ["Prithvi-EO-2.0-300M-TL-Sen1Floods11", "Combined Exposure Pipeline"],
            "event": "Riverine Flood Event"
        },
        {
            "id": "usa-midwest-sen1floods11",
            "name": "USA — Midwest Flooding Event",
            "file": "USA_430764_S2Hand.tif",
            "type": "Sentinel-2 L1C Multispectral (13 bands, 10m GSD)",
            "location": "Midwest, United States",
            "sensor": "Sentinel-2 MSI",
            "bands_count": 13,
            "compatible_models": ["Prithvi-EO-2.0-300M-TL-Sen1Floods11", "Combined Exposure Pipeline"],
            "event": "Major Inundation"
        }
    ]
    return jsonify({"samples": samples})


@app.route("/api/infer/prithvi", methods=["POST"])
def infer_prithvi():
    """
    Runs the official Prithvi EO 2.0 flood segmentation model on uploaded or sample GeoTIFF.
    """
    file_path = None
    if "file" in request.files:
        uploaded_file = request.files["file"]
        if uploaded_file.filename == "":
            return jsonify({"error": "No file selected"}), 400
        filename = secure_filename(uploaded_file.filename)
        file_path = os.path.join(UPLOAD_FOLDER, f"{uuid.uuid4().hex[:8]}_{filename}")
        uploaded_file.save(file_path)
    elif request.json and "sample_id" in request.json:
        sample_id = request.json["sample_id"]
        sample_files = {
            "india-assam-sen1floods11": "India_900498_S2Hand.tif",
            "spain-ebro-sen1floods11": "Spain_7370579_S2Hand.tif",
            "usa-midwest-sen1floods11": "USA_430764_S2Hand.tif"
        }
        filename = sample_files.get(sample_id, "India_900498_S2Hand.tif")
        file_path = os.path.join(SAMPLES_FOLDER, filename)
    else:
        return jsonify({"error": "No file or sample_id provided"}), 400

    try:
        # Validate format
        val = validate_input_geotiff(file_path)
        if not val["valid"]:
            return jsonify({
                "error": "Validation Failed",
                "details": val["error_message"],
                "received_bands": val["band_count"]
            }), 422

        results = run_prithvi_flood_inference(
            data_file=file_path,
            output_dir=OUTPUT_FOLDER
        )
        return jsonify(results)
    except Exception as e:
        return jsonify({"error": "Inference Execution Failed", "message": str(e)}), 500


@app.route("/api/infer/buildings", methods=["POST"])
def infer_buildings():
    """
    Runs optical building footprint detector on RGB imagery.
    """
    file_path = None
    if "file" in request.files:
        uploaded_file = request.files["file"]
        filename = secure_filename(uploaded_file.filename)
        file_path = os.path.join(UPLOAD_FOLDER, f"{uuid.uuid4().hex[:8]}_{filename}")
        uploaded_file.save(file_path)
    else:
        return jsonify({"error": "No optical image file provided"}), 400

    try:
        conf = float(request.form.get("confidence", 0.45))
        result = building_pipeline.detect_buildings(file_path, confidence_threshold=conf)
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": "Building Detection Failed", "message": str(e)}), 500


@app.route("/api/infer/combined", methods=["POST"])
def infer_combined_disaster_pipeline():
    """
    Full End-to-End Pipeline:
    Input GeoTIFF -> Validation -> Building Footprints -> Prithvi Flood Mask -> Spatial Intersection -> Prioritized Assessment
    """
    file_path = None
    if "file" in request.files:
        uploaded_file = request.files["file"]
        filename = secure_filename(uploaded_file.filename)
        file_path = os.path.join(UPLOAD_FOLDER, f"{uuid.uuid4().hex[:8]}_{filename}")
        uploaded_file.save(file_path)
    elif request.json and "sample_id" in request.json:
        sample_id = request.json["sample_id"]
        sample_files = {
            "india-assam-sen1floods11": "India_900498_S2Hand.tif",
            "spain-ebro-sen1floods11": "Spain_7370579_S2Hand.tif",
            "usa-midwest-sen1floods11": "USA_430764_S2Hand.tif"
        }
        filename = sample_files.get(sample_id, "India_900498_S2Hand.tif")
        file_path = os.path.join(SAMPLES_FOLDER, filename)
    else:
        return jsonify({"error": "No dataset specified"}), 400

    try:
        # Step 1: Run Prithvi Flood Segmentation
        flood_results = run_prithvi_flood_inference(data_file=file_path, output_dir=OUTPUT_FOLDER)

        # Step 2: Run Building Detection
        building_results = building_pipeline.detect_buildings(file_path, confidence_threshold=0.45)

        # Step 3: Spatial Overlay
        # Read the generated flood mask from output geotiff
        import rasterio
        with rasterio.open(flood_results["geotiff_output_path"]) as src:
            flood_mask = src.read(1)

        exposure_analysis = calculate_flood_exposure(building_results["buildings"], flood_mask)

        return jsonify({
            "status": "complete",
            "pipeline": "Prithvi Flood Segmentation + Optical Building Exposure Assessment",
            "flood_analysis": flood_results,
            "building_analysis": {
                "total_detected": building_results["total_buildings_detected"],
                "model": building_results["model_type"],
                "confidence_threshold": building_results["confidence_threshold"],
                "structural_damage_assessment": "Not assessed — compatible damage model required"
            },
            "exposure_summary": exposure_analysis,
            "rescue_recommendation": {
                "priority_level": exposure_analysis["rescue_priority_level"],
                "affected_structures": exposure_analysis["flood_exposed_buildings"],
                "flooded_area_km2": flood_results["flooded_area_km2"],
                "action_protocol": (
                    "Deploy amphibious response teams to inundated structures; establish staging perimeter outside predicted flood extent."
                    if exposure_analysis["flood_exposed_buildings"] > 0
                    else "No structures currently inundated within analyzed flood perimeter. Maintain sensor patrol."
                )
            }
        })
    except Exception as e:
        return jsonify({"error": "Combined Pipeline Error", "message": str(e)}), 500


# ==========================================
# JATAYU Emergency Alert Gateway Routes
# ==========================================

from telegram_service import verify_telegram_bot, send_telegram_alert, mask_chat_id


@app.route("/api/telegram-alert", methods=["POST"])
def telegram_alert_route():
    """
    Receives tactical and autonomous disaster alerts and dispatches them to Telegram.
    """
    payload = request.get_json(silent=True) or {}
    result = send_telegram_alert(payload)
    status_code = 200 if result.get("ok") else (500 if result.get("code") == "MISSING_CREDENTIALS" else 400)
    return jsonify(result), status_code


@app.route("/api/telegram-test", methods=["GET", "POST"])
def telegram_test_route():
    """
    Diagnoses bot authentication and transmits a verified test signal.
    """
    bot_check = verify_telegram_bot()
    if not bot_check.get("ok"):
        return jsonify({
            "ok": False,
            "bot_verified": False,
            "delivered": False,
            "code": bot_check.get("code", "INVALID_TOKEN"),
            "error": f"Telegram bot verification failed: {bot_check.get('error')}"
        }), 401

    chat_id = os.environ.get("TELEGRAM_CHAT_ID", "").strip()
    send_result = send_telegram_alert({
        "eventType": "test",
        "testNotes": f"Direct connection verification requested from JATAYU Python Gateway. Bot: {bot_check.get('bot_username', 'Active')}"
    })

    if not send_result.get("ok"):
        return jsonify({
            "ok": False,
            "bot_verified": True,
            "delivered": False,
            "bot_username": bot_check.get("bot_username"),
            "chat_id": mask_chat_id(chat_id),
            "error": f"Bot verified ({bot_check.get('bot_username')}), but message delivery failed: {send_result.get('error')}"
        }), 400

    return jsonify({
        "ok": True,
        "bot_verified": True,
        "delivered": True,
        "bot_username": bot_check.get("bot_username"),
        "chat_id": mask_chat_id(chat_id),
        "message_id": send_result.get("message_id"),
        "message": f"Connection verified! Test alert delivered to Chat ID {mask_chat_id(chat_id)} via {bot_check.get('bot_username')}."
    }), 200


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=False)
