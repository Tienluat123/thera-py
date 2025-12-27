"""
API routes for the chatbot application.
"""

import logging
from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Header
from app.config import settings
from app.models import ChatResponse
from app.services import (
    emotion_service,
    stt_service,
    chatbot_service,
)
from app.services.auth import get_user_id_from_token
from app.services.chat_history import save_message, get_recent_messages

logger = logging.getLogger(__name__)
router = APIRouter()


def _validate_audio_file(file: UploadFile) -> None:
    """Validate audio file."""
    allowed_types = ["audio/wav", "audio/mpeg", "audio/mp3", "audio/x-wav"]
    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=400, 
            detail=f"Định dạng file không hỗ trợ (cho phép: WAV, MP3)"
        )


@router.post("/emotion")
async def detect_emotion(
    file: UploadFile = File(...),
):
    """Detect emotion from audio bytes (backward compatibility)."""
    try:
        _validate_audio_file(file)
        audio_bytes = await file.read()
        if not audio_bytes:
            raise HTTPException(400, "Audio file is empty")

        result = emotion_service.predict(audio_bytes)
        return result

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Emotion endpoint error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Internal server error")


@router.post("/chat", response_model=ChatResponse)
async def chat(
    file: UploadFile = File(...),
    text: str = Form(default=""),
    authorization: str = Header(default=None),
):
    """
    Main chat endpoint - Saves user message FIRST, then processes reply.
    """
    try:
        # Validate
        _validate_audio_file(file)

        # Read audio
        audio_bytes = await file.read()
        if not audio_bytes:
            raise HTTPException(status_code=400, detail="Audio file is empty")
        
        if len(audio_bytes) > settings.MAX_AUDIO_SIZE:
            raise HTTPException(status_code=413, detail="Audio file too large")

        # Use frontend text or fallback to STT
        user_text = (text or "").strip()
        if not user_text:
            raise HTTPException(status_code=400, detail="Text is required")

        logger.info(
            f"Processing chat: text_len={len(user_text)}, audio_size={len(audio_bytes)} bytes"
        )

        # Emotion Detection from audio (graceful fallback if audio is invalid)
        emotion = "neutral"
        confidence = 0.0
        try:
            emotion_result = emotion_service.predict(audio_bytes)
            emotion = emotion_result.get("emotion", "neutral")
            confidence = emotion_result.get("confidence", 0.0)
        except Exception as emotion_err:
            logger.warning(f"Emotion detection failed: {emotion_err}")

        # Get user_id early for fetching recent messages (optional)
        user_id = None
        if authorization:
            try:
                user_id = get_user_id_from_token(authorization)
            except Exception as auth_err:
                logger.warning(f"Auth failed: {auth_err}")
                # Continue without user_id if auth fails

        # ===== SAVE USER MESSAGE FIRST (before calling LLM) =====
        if user_id:
            try:
                save_message(
                    user_id=user_id,
                    role="user",
                    content=user_text,
                    emotion=emotion,
                    confidence=confidence,
                )
                logger.info(f"User message saved for {user_id}")
            except Exception as save_err:
                logger.error(f"Failed to save user message: {save_err}", exc_info=True)
                # Don't fail the request, continue to get reply

        # Get recent messages for context (optional)
        recent_messages = []
        if user_id:
            try:
                recent_messages = get_recent_messages(user_id, limit=5)
            except Exception as fetch_err:
                logger.warning(f"Failed to fetch recent messages: {fetch_err}")

        # Get chatbot reply
        try:
            reply_text = chatbot_service.get_reply(
                user_text=user_text,
                emotion=emotion,
                recent_messages=recent_messages,
            )
        except Exception as llm_err:
            logger.error(f"LLM error: {llm_err}", exc_info=True)
            # Return error but user message is already saved
            raise HTTPException(
                status_code=503,
                detail=f"Chatbot service temporarily unavailable: {str(llm_err)}"
            )

        # ===== SAVE ASSISTANT REPLY (after successful LLM response) =====
        if user_id:
            try:
                save_message(
                    user_id=user_id,
                    role="assistant",
                    content=reply_text,
                    emotion=None,
                    confidence=None,
                )
                logger.info(f"Assistant message saved for {user_id}")
            except Exception as save_err:
                logger.error(f"Failed to save assistant message: {save_err}", exc_info=True)
                # Still return the reply even if saving failed

        return ChatResponse(
            user_text=user_text,
            reply_text=reply_text,
            emotion=emotion,
            confidence=confidence,
            audio_url=None,
        )

    except HTTPException:
        raise
    except RuntimeError as e:
        logger.error(f"Runtime error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Internal server error")
    except Exception as e:
        logger.error(f"Unexpected error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Internal server error")