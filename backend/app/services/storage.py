"""
Storage service for managing audio files.
"""

import os
import time
import logging
from app.config import settings

logger = logging.getLogger(__name__)


class StorageService:
    """Service for managing audio file storage."""

    def __init__(self):
        """Initialize storage service."""
        os.makedirs(settings.AUDIO_DIR, exist_ok=True)

    def cleanup_old_files(self):
        """Delete audio files older than AUDIO_CLEANUP_HOURS."""
        try:
            cutoff_time = time.time() - (settings.AUDIO_CLEANUP_HOURS * 3600)
            deleted_count = 0

            for filename in os.listdir(settings.AUDIO_DIR):
                file_path = os.path.join(settings.AUDIO_DIR, filename)

                # Only delete .mp3 files (TTS output)
                if not filename.endswith(".mp3"):
                    continue

                if os.path.isfile(file_path):
                    file_time = os.path.getmtime(file_path)
                    if file_time < cutoff_time:
                        try:
                            os.remove(file_path)
                            deleted_count += 1
                            logger.info(f"Deleted old audio file: {filename}")
                        except Exception as e:
                            logger.warning(f"Failed to delete {filename}: {e}")

            logger.info(f"Cleanup completed: {deleted_count} files deleted")

        except Exception as e:
            logger.error(f"Storage cleanup error: {e}")

    def get_file_size(self, file_path: str) -> int:
        """Get file size in bytes."""
        try:
            return os.path.getsize(file_path)
        except Exception as e:
            logger.warning(f"Failed to get file size for {file_path}: {e}")
            return 0


# Singleton instance
storage_service = StorageService()
