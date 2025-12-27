"""
API routes for the chatbot application.
"""

import logging
from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from app.config import settings
from app.models import ChatResponse
from app.services import (
    emotion_service,
    chatbot_service,
)

logger = logging.getLogger(__name__)
router = APIRouter()


def _validate_audio_file(file: UploadFile) -> None:
    """Validate audio filev"""
    # Check file size
    if file.size and file.size > settings.MAX_AUDIO_SIZE:
        raise HTTPException(
            status_code=400,
            detail=f"File quá lớn (max {settings.MAX_AUDIO_SIZE / (1024*1024):.0f}MB)",
        )

    # Check content type - WAV only
    if file.content_type not in ["audio/wav", "audio/x-wav"]:
        raise HTTPException(
            status_code=400, detail="Chỉ hỗ trợ định dạng WAV"
        )


@router.post("/chat", response_model=ChatResponse)
async def chat(file: UploadFile = File(...), text: str = Form(None)):
    """
    Main chat endpoint - Single request handling.

    Processes audio for emotion detection and combines with user text for LLM.
    Frontend handles STT & TTS separately (browser APIs).

    Args:
        file: Audio file (WAV/MP3) for emotion detection
        text: User's transcribed text (from frontend STT) - REQUIRED

    Returns:
        ChatResponse with user text, reply, emotion, and confidence
    """
    try:
        # Validate
        _validate_audio_file(file)

        # Read audio
        audio_bytes = await file.read()
        if not audio_bytes:
            raise HTTPException(400, "Audio file is empty")

        # Require text from frontend (no backend STT)
        user_text = (text or "").strip()
        if not user_text:
            raise HTTPException(400, "Thiếu 'text' từ frontend STT")

        logger.info(
            f"Processing chat: text_len={len(user_text)}, audio_size={len(audio_bytes)} bytes"
        )

        # Emotion Detection from audio
        emotion_result = emotion_service.predict(audio_bytes)
        emotion = emotion_result["emotion"]
        confidence = emotion_result["confidence"]

        # Chat Response
        reply_text = chatbot_service.get_reply(user_text, emotion)

        logger.info(f"Chat completed: emotion={emotion}, confidence={confidence:.2f}")

        return ChatResponse(
            user_text=user_text,
            reply_text=reply_text,
            emotion=emotion,
            confidence=confidence,
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Chat endpoint error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Internal server error")
