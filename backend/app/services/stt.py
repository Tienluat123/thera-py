"""
Speech-to-Text service using Whisper.
"""

import tempfile
import os
import whisper
import logging
from app.config import settings

logger = logging.getLogger(__name__)


class STTService:
    """Speech-to-Text service."""

    def __init__(self):
        """Initialize STT service and load Whisper model."""
        self.model = self._load_model()

    def _load_model(self):
        """Load Whisper model with fallback."""
        try:
            logger.info(f"Loading Whisper model from {settings.WHISPER_MODEL}...")
            return whisper.load_model(settings.WHISPER_MODEL, device="cpu")
        except Exception as e:
            logger.warning(f"Failed to load local model: {e}. Using 'small' instead.")
            return whisper.load_model("small", device="cpu")

    def transcribe(self, audio_bytes: bytes) -> str:
        """
        Transcribe audio bytes to Vietnamese text.

        Args:
            audio_bytes: Raw audio bytes

        Returns:
            Transcribed text

        Raises:
            RuntimeError: If transcription fails
        """
        tmp_path = None
        try:
            # Write to temp file
            with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as f:
                f.write(audio_bytes)
                tmp_path = f.name

            # Transcribe
            result = self.model.transcribe(tmp_path, language="vi")
            text = (result.get("text") or "").strip()

            logger.info(f"STT success: {len(text)} characters")
            return text

        except Exception as e:
            logger.error(f"STT error: {e}")
            raise RuntimeError(f"Speech-to-text failed: {str(e)}")

        finally:
            # Cleanup temp file
            if tmp_path and os.path.exists(tmp_path):
                try:
                    os.remove(tmp_path)
                except Exception as e:
                    logger.warning(f"Failed to remove temp file: {e}")


# Singleton instance
stt_service = STTService()
