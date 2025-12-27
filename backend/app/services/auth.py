from app.db import supabase

def get_user_id_from_token(token: str) -> str:
    if token.lower().startswith("bearer "):
        token = token[7:]

    res = supabase.auth.get_user(token)
    if not res.user:
        raise RuntimeError("Invalid token")

    return res.user.id
