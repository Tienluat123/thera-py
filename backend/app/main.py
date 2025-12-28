"""
Main entry point for FastAPI application.
"""

import logging
import sys
import traceback

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Configure logging FIRST
logging.basicConfig(
    level="INFO",
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)

logger.info("Starting app initialization...")

try:
    from app.config import settings

    logger.info("✓ Config loaded")
except Exception as e:
    logger.error(f"✗ Failed to load config: {e}")
    traceback.print_exc()
    settings = None

try:
    from app.api.routes import router

    logger.info("✓ Routes loaded")
except Exception as e:
    logger.error(f"✗ Failed to load routes: {e}")
    traceback.print_exc()
    # Create empty router if routes fail
    from fastapi import APIRouter

    router = APIRouter()

# Create FastAPI app
logger.info("Creating FastAPI app...")
app = FastAPI(
    title="Thera.py API",
    description="Chatbot API with emotion detection and text-to-speech",
    version="1.0.0",
)

# Configure CORS
origins = [
    "http://localhost:3000",
    "http://localhost:5173",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:5173",
    "https://thera-frontend.vercel.app",
    "*",  # Allow all origins for development
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routes
app.include_router(router)


@app.get("/")
async def root():
    """Root endpoint"""
    return {"message": "Thera.py API is running", "docs": "/docs", "version": "1.0.0"}


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy"}


logger.info("✓ App initialized successfully")

if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
