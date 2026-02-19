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
# Tolerant: continues even if download fails (e.g. no internet at build time)
RUN python -c "
try:
    from spleeter.separator import Separator
    Separator('spleeter:2stems')
    Separator('spleeter:4stems')
    Separator('spleeter:5stems')
    print('Models downloaded successfully')
except Exception as e:
    print(f'Warning: could not pre-download models: {e}')
" || true

COPY app.py .

EXPOSE 5001

CMD ["python", "app.py"]
