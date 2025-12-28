# Build stage
FROM python:3.10-slim as builder

WORKDIR /build
COPY backend/requirements-prod.txt .

# Install dependencies to /build/.local
RUN pip install --user --no-cache-dir -r requirements-prod.txt

# Runtime stage
FROM python:3.10-slim

WORKDIR /app

# Copy Python packages
COPY --from=builder /build/.local /root/.local

# Copy backend code
COPY backend/ .

# Set PATH and environment
ENV PATH=/root/.local/bin:$PATH \
    PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1

# Health check
HEALTHCHECK --interval=30s --timeout=10s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

# Run
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
