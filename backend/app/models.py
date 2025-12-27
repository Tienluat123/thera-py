"""
Pydantic models for request/response validation.
"""

from pydantic import BaseModel
from typing import Optional


class ChatResponse(BaseModel):
    """Standard chat response format."""
    user_text: str
    reply_text: str
    emotion: str
    confidence: Optional[float] = None
    audio_url: Optional[str] = None 


class HealthResponse(BaseModel):
    """Health check response."""
    status: str
    version: str
