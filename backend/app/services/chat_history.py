"""Utilities for persisting chat messages."""

import logging
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
