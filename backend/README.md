# JATAYU Geospatial Inference Backend

This directory contains the production Python inference backend for **JATAYU**, hosting the official **NASA-IBM Prithvi EO 2.0 Flood Segmentation Model** (`ibm-nasa-geospatial/Prithvi-EO-2.0-300M-TL-Sen1Floods11`) and the optical **Building Footprint Pipeline**.

## Why a Dedicated Backend is Required
The JATAYU frontend is hosted on **Vercel**. Vercel Serverless Functions have:
* A maximum uncompressed size limit of 50 MB - 250 MB.
* A strict execution timeout (10s - 60s).
* Inability to run heavy C/C++ compiled geospatial libraries (`GDAL`, `PROJ`, `rasterio`) alongside large PyTorch foundation models (`Prithvi-EO-V2-300M-TL` is 1.28 GB).

This backend solves that problem by running as a high-performance standalone service on Google Cloud Run, Hugging Face Spaces, AWS ECS, or a GPU/CPU VM.

---

## Model & Checkpoint Details
* **Foundation Model:** `Prithvi-EO-2.0-300M-TL-Sen1Floods11`
* **Checkpoint:** `Prithvi-EO-V2-300M-TL-Sen1Floods11.pt` (1.28 GB)
* **Configuration:** `config.yaml` / `sen1floods11.yaml`
* **Input Bands (6 Required):** `[Blue (B2), Green (B3), Red (B4), Narrow NIR (B8A), SWIR-1 (B11), SWIR-2 (B12)]`
* **Normalization:** Sentinel-2 DN values scaled by `0.0001` (Digital Numbers to Reflectance).
* **Target Classes:**
  * `0`: Non-water / Land
  * `1`: Surface Water / Flood Extent
  * `-1`: No-Data / Cloud
* **Building Detector:** Optical RGB feature pipeline with model adapter for YOLOv8x / SpaceNet building weights.
* **Damage Assessment Status:** `"Not assessed — compatible damage model required"`.

---

## 1. Quick Local Start

```bash
cd backend
pip install -r requirements.txt
python app.py
```
The server will start on `http://localhost:5000`.

---

## 2. Deploying to Google Cloud Run (Recommended)

1. Build and push the Docker container:
```bash
gcloud builds submit --tag gcr.io/YOUR_PROJECT_ID/jatayu-backend .
```

2. Deploy with 4 GB RAM and 2 CPUs:
```bash
gcloud run deploy jatayu-backend \
  --image gcr.io/YOUR_PROJECT_ID/jatayu-backend \
  --platform managed \
  --region us-central1 \
  --memory 4Gi \
  --cpu 2 \
  --timeout 300 \
  --allow-unauthenticated
```

3. Note your Cloud Run service URL, e.g.:
`https://jatayu-backend-xyz.run.app`

---

## 3. Configuring Vercel Frontend

In your Vercel Dashboard for `jatayuu-jet` / `jatayu2-jet`:
1. Go to **Settings** -> **Environment Variables**.
2. Add:
   * **Key:** `VITE_INFERENCE_API_URL`
   * **Value:** `https://jatayu-backend-xyz.run.app` (your deployed backend URL)
3. Trigger a redeploy on Vercel.

The JATAYU frontend will immediately connect to your live inference backend, perform real-time health checks, execute Prithvi ViT inferences, and display true geospatial flood overlays and building exposure intersections.
