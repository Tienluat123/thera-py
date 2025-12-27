"""Utilities for persisting chat messages."""

import logging
from datetime import date, datetime, timedelta
from app.db import supabase

logger = logging.getLogger(__name__)


def save_message(
    user_id: str,
    role: str,
    content: str,
    emotion: str | None = None,
    confidence: float | None = None,
):
    """Insert a message row into the messages table."""
    if not user_id:
        raise ValueError("user_id is required to save a message")

    try:
        return supabase.table("messages").insert(
            {
                "user_id": user_id,
                "role": role,
                "content": content,
                "emotion": emotion,
                "confidence": confidence,
            }
        ).execute()
    except Exception as exc:
        logger.error("Failed to save message to Supabase: %s", exc, exc_info=True)
        raise


def get_recent_messages(user_id: str, limit: int = 5) -> list[dict]:
    """Get the most recent messages for a user.
    
    Args:
        user_id: User ID to fetch messages for
        limit: Number of recent messages to fetch (default 5)
        
    Returns:
        List of message dictionaries ordered by created_at ascending
    """
    if not user_id:
        raise ValueError("user_id is required to fetch messages")
    
    try:
        response = (
            supabase.table("messages")
            .select("role, content, emotion, created_at")
            .eq("user_id", user_id)
            .order("created_at", desc=True)
            .limit(limit)
            .execute()
        )
        
        # Return reversed so oldest message is first
        return list(reversed(response.data)) if response.data else []
    except Exception as exc:
        logger.error("Failed to fetch recent messages: %s", exc, exc_info=True)
        return []

def get_emotion_stats_by_date(user_id: str, target_date: date | str) -> dict:
    """Get emotion statistics for a specific date.
    
    Args:
        user_id: User ID to fetch messages for
        target_date: Date to get stats for (can be date object or string "YYYY-MM-DD")
        
    Returns:
        Dictionary with emotion counts: {"happy": 0, "sad": 0, "neutral": 0, "angry": 0}
    """
    if not user_id:
        raise ValueError("user_id is required to fetch emotion stats")
    
    # Convert string to date if needed
    if isinstance(target_date, str):
        target_date = datetime.strptime(target_date, "%Y-%m-%d").date()
    elif isinstance(target_date, datetime):
        target_date = target_date.date()
    
    try:
        # Define date range (start and end of day)
        start_of_day = datetime.combine(target_date, datetime.min.time()).isoformat() + "Z"
        end_of_day = datetime.combine(target_date, datetime.max.time()).isoformat() + "Z"
        
        # Query messages for the date with emotion field
        response = (
            supabase.table("messages")
            .select("emotion")
            .eq("user_id", user_id)
            .gte("created_at", start_of_day)
            .lte("created_at", end_of_day)
            .execute()
        )
        
        # Initialize emotion counts
        emotion_counts = {
            "happy": 0,
            "neutral": 0,
            "sad": 0,
            "angry": 0,
        }
        
        # Count emotions (only count user messages with emotion data)
        for msg in response.data:
            if msg.get("emotion"):
                emotion = msg["emotion"].lower()
                if emotion in emotion_counts:
                    emotion_counts[emotion] += 1
        
        return emotion_counts
    except Exception as exc:
        logger.error("Failed to fetch emotion stats: %s", exc, exc_info=True)
        return {"happy": 0, "neutral": 0, "sad": 0, "angry": 0}