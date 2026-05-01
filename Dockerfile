FROM python:3.11-slim

WORKDIR /app

# System dependencies for PyMuPDF
RUN apt-get update && apt-get install -y \
    libgl1 \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir --extra-index-url https://download.pytorch.org/whl/cpu -r requirements.txt

# Copy application code
COPY . .

# Create local fallback dirs (overridden by Render disk mount at /data)
RUN mkdir -p storage downloads

EXPOSE 8000
CMD uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}
