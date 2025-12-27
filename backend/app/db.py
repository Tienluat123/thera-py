"""Supabase client setup with validation."""

import logging
from supabase import create_client
from app.config import settings

logger = logging.getLogger(__name__)


def _init_client():
    if not settings.SUPABASE_URL:
        raise RuntimeError("SUPABASE_URL is not configured")

    key = settings.SUPABASE_SERVICE_ROLE_KEY or settings.SUPABASE_ANON_KEY
    if not key:
        raise RuntimeError(
            "No Supabase key configured. Set SUPABASE_SERVICE_ROLE_KEY (recommended) or SUPABASE_ANON_KEY."
        )

    client = create_client(settings.SUPABASE_URL, key)
    logger.info(
        "Supabase client initialized with %s key",
        "service role" if settings.SUPABASE_SERVICE_ROLE_KEY else "anon",
    )
    return client


supabase = _init_client()
