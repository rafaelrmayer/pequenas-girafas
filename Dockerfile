FROM python:3.12-slim
ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt && useradd --create-home appuser
COPY backend/app backend/app
COPY backend/__init__.py backend/__init__.py
COPY frontend frontend
COPY knowledge knowledge
USER appuser
EXPOSE 8000
CMD ["sh", "-c", "exec python -m uvicorn backend.app.main:app --host 0.0.0.0 --port \"${PORT:-8000}\" --no-access-log"]
