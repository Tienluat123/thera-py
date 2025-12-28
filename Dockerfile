# Multi-stage build để giảm kích thước Docker image
FROM python:3.10-slim as builder

WORKDIR /app
COPY backend/requirements-prod.txt .

# Install dependencies with no cache
RUN pip install --user --no-cache-dir -r requirements-prod.txt && \
    # Clean pip cache
    rm -rf /root/.cache/pip

# Final image
FROM python:3.10-slim

WORKDIR /app

# Copy Python packages từ builder
COPY --from=builder /root/.local /root/.local

# Copy entire backend (app + config + everything)
COPY backend ./

# Set environment
ENV PATH=/root/.local/bin:$PATH \
    PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PYTHONPATH=/app

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD python -c "import requests; requests.get('http://localhost:8000/docs', timeout=5)" || exit 1

# Run
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]

