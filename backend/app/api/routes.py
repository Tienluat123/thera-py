"""
API routes for the chatbot application.
"""

import logging
from datetime import date, datetime
from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Header, Query
from app.config import settings
from app.models import ChatResponse
from app.services import (
    emotion_service,
    chatbot_service,
)
from app.services.chat_history import save_message, get_recent_messages, get_emotion_stats_by_date
from app.services.auth import get_user_id_from_token

logger = logging.getLogger(__name__)
router = APIRouter()


def _validate_audio_file(file: UploadFile) -> None:
    """Validate audio file."""
    # Check file size
    if file.size and file.size > settings.MAX_AUDIO_SIZE:
        raise HTTPException(
            status_code=400,
            detail=f"File quá lớn (max {settings.MAX_AUDIO_SIZE / (1024*1024):.0f}MB)",
        )

    # Check content type - WAV only
    if file.content_type not in ["audio/wav", "audio/x-wav"]:
        raise HTTPException(status_code=400, detail="Chỉ hỗ trợ định dạng WAV")


@router.post("/chat", response_model=ChatResponse)
async def chat(
    file: UploadFile = File(...),
    text: str = Form(default=""),
    authorization: str = Header(default=None),
):
    """
    Main chat endpoint - Processes audio + saves to DB if user logged in.
    """
    try:
        # Validate
        _validate_audio_file(file)

        # Read audio
        audio_bytes = await file.read()
        if not audio_bytes:
            raise HTTPException(400, "Audio file is empty")

        # User text (required)
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

        # Get user_id from token if provided
        user_id = None
        if authorization:
            try:
                user_id = get_user_id_from_token(authorization)
            except Exception as auth_err:
                logger.warning(f"Auth failed: {auth_err}")

        # Save user message if logged in
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
                logger.error(f"Failed to save user message: {save_err}")

        # Get recent messages for context if logged in
        recent_messages = []
        if user_id:
            try:
                recent_messages = get_recent_messages(user_id, limit=5)
            except Exception as fetch_err:
                logger.warning(f"Failed to fetch recent messages: {fetch_err}")

        # Chat Response
        reply_text = chatbot_service.get_reply(
            user_text=user_text,
            emotion=emotion,
            recent_messages=recent_messages if user_id else [],
        )

        # Save assistant reply if logged in
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
                logger.error(f"Failed to save assistant message: {save_err}")

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

@router.get("/emotion-stats")
async def get_emotion_stats(
    date_param: str = Query(..., description="Date in format YYYY-MM-DD"),
    authorization: str = Header(default=None),
):
    """
    Get emotion statistics for a specific date.
    
    Returns: {"happy": int, "neutral": int, "sad": int, "angry": int}
    """
    try:
        # Get user_id from token
        if not authorization:
            raise HTTPException(status_code=401, detail="Authorization header required")
        
        try:
            user_id = get_user_id_from_token(authorization)
        except Exception as auth_err:
            logger.warning(f"Auth failed: {auth_err}")
            raise HTTPException(status_code=401, detail="Invalid token")
        
        # Validate date format
        try:
            datetime.strptime(date_param, "%Y-%m-%d")
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid date format, use YYYY-MM-DD")
        
        # Get emotion stats
        stats = get_emotion_stats_by_date(user_id, date_param)
        
        return stats
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Emotion stats endpoint error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Internal server error")