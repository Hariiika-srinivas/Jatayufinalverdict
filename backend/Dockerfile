# JATAYU Geospatial Inference Backend Dockerfile
FROM python:3.11-slim

# Install system GDAL, PROJ, and C++ compiler
RUN apt-get update && apt-get install -y --no-install-recommends \
    gdal-bin \
    libgdal-dev \
    build-essential \
    curl \
    git \
    && rm -rf /var/lib/apt/lists/*

ENV CPLUS_INCLUDE_PATH=/usr/include/gdal
ENV C_INCLUDE_PATH=/usr/include/gdal

WORKDIR /app

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application files
COPY . .

# Download model checkpoint if not present
RUN mkdir -p ../models && \
    curl -L -o ../models/Prithvi-EO-V2-300M-TL-Sen1Floods11.pt \
    https://huggingface.co/ibm-nasa-geospatial/Prithvi-EO-2.0-300M-TL-Sen1Floods11/resolve/main/Prithvi-EO-V2-300M-TL-Sen1Floods11.pt || true

EXPOSE 5000

CMD ["gunicorn", "--bind", "0.0.0.0:5000", "--workers", "2", "--timeout", "120", "app:app"]
