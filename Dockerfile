FROM python:3.11-slim

WORKDIR /app

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir --extra-index-url https://download.pytorch.org/whl/cpu -r requirements.txt

# Copy application code
COPY . .

# Create ephemeral storage directories
RUN mkdir -p storage downloads

EXPOSE 8000

# Use uvicorn to serve the app
CMD uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}
