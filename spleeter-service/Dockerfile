FROM python:3.9-slim

# Install system dependencies for audio processing
RUN apt-get update && apt-get install -y \
    ffmpeg \
    libsndfile1 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Pre-download Spleeter models at build time to avoid runtime delays
RUN python -c "from spleeter.separator import Separator; Separator('spleeter:2stems'); Separator('spleeter:4stems'); Separator('spleeter:5stems')"

COPY app.py .

EXPOSE 5001

CMD ["python", "app.py"]
