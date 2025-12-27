"""
Main entry point for the FastAPI application.
"""

import logging
import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.config import settings
from app.api.routes import router

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)

# Create FastAPI app
app = FastAPI(
    title=settings.API_TITLE,
    version=settings.API_VERSION,
    description="Therapist Chat API with voice support",
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static audio directory
try:
    app.mount("/audio", StaticFiles(directory=settings.AUDIO_DIR), name="audio")
except:
    logger.warning("Audio directory not found, skipping mount")

# Include API routes (with and without /api for compatibility)
app.include_router(router, prefix="/api")
app.include_router(router)


@app.get("/")
async def root():
    """Root endpoint - returns API info."""
    return {
        "message": "Welcome to Therapist Chat API",
        "version": settings.API_VERSION,
        "docs": "/docs",
    }


@app.get("/health")
async def health():
    """Health check endpoint."""
    return {"status": "ok"}


@app.on_event("startup")
async def startup_event():
    """Run on app startup."""
    logger.info("Starting Therapist Chat API...")
    logger.info(f"Using emotion model: {settings.EMOTION_MODEL_PATH}")


@app.on_event("shutdown")
async def shutdown_event():
    """Run on app shutdown."""
    logger.info("Shutting down Therapist Chat API...")


if __name__ == "__main__":
    logger.info("Starting Therapist Chat API...")
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)
