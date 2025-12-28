# Multi-stage build để giảm kích thước Docker image
FROM python:3.10-slim as builder

WORKDIR /app
COPY backend/requirements-prod.txt .

# Install dependencies
RUN pip install --user --no-cache-dir -r requirements-prod.txt

# Final image
FROM python:3.10-slim

WORKDIR /app

# Copy Python packages từ builder
COPY --from=builder /root/.local /root/.local

# Copy app code
COPY backend/ .

# Set environment
ENV PATH=/root/.local/bin:$PATH \
    PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1

# Run
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
