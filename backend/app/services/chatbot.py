"""
Chatbot service using Google Generative AI (Gemini).
"""

import os
import warnings
import google.generativeai as genai
import logging
from app.config import settings

# Suppress deprecation warning for google.generativeai
warnings.filterwarnings("ignore", category=FutureWarning, module="google.generativeai")

logger = logging.getLogger(__name__)


class ChatbotService:
    """Chatbot service using Gemini LLM."""

    def __init__(self):
        """Initialize Gemini model."""
        self.model = self._init_model()
        self.chat_session = None

    def _init_model(self):
        """Initialize Gemini model with configuration."""
        api_key = settings.GOOGLE_API_KEY
        if not api_key:
            raise RuntimeError(
                "GOOGLE_API_KEY not found in environment variables. "
                "Set GOOGLE_API_KEY or GEMINI_API_KEY."
            )

        genai.configure(api_key=api_key)
        logger.info(f"Initialized Gemini model: {settings.GEMINI_MODEL}")

        # Safety settings để tránh bị block
        safety_settings = [
            {"category": "HARM_CATEGORY_HARASSMENT", "threshold": "BLOCK_ONLY_HIGH"},
            {"category": "HARM_CATEGORY_HATE_SPEECH", "threshold": "BLOCK_ONLY_HIGH"},
            {"category": "HARM_CATEGORY_SEXUALLY_EXPLICIT", "threshold": "BLOCK_ONLY_HIGH"},
            {"category": "HARM_CATEGORY_DANGEROUS_CONTENT", "threshold": "BLOCK_ONLY_HIGH"},
        ]

        return genai.GenerativeModel(
            model_name=settings.GEMINI_MODEL,
            system_instruction=(
                "Bạn là trợ lý ảo giao tiếp bằng giọng nói. "
                "1. Trả lời TIẾNG VIỆT, ngắn gọn (dưới 2 câu), súc tích để người dùng nghe kịp. "
                "2. Giọng điệu tự nhiên, như người thật, có cảm xúc. "
                "3. KHÔNG dùng icon, emoji (vì đây là voice chat). "
                "4. Dựa vào ngữ cảnh cảm xúc được cung cấp để điều chỉnh thái độ (vui vẻ, đồng cảm, bình tĩnh...)."
            ),
            generation_config={
                "temperature": settings.LLM_TEMPERATURE,
                "max_output_tokens": settings.LLM_MAX_TOKENS,
            },
            safety_settings=safety_settings,
        )

    def _get_chat_session(self):
        """Initialize session if not exists (for single user context)."""
        if self.chat_session is None:
            self.chat_session = self.model.start_chat(history=[])
        return self.chat_session

    def get_reply(self, user_text: str, emotion: str = "neutral", recent_messages: list[dict] | None = None) -> str:
        """
        Generate chatbot reply based on user text, emotion, and optional conversation history.

        Args:
            user_text: User's current message
            emotion: Detected emotion (used for context)
            recent_messages: List of recent messages for context (optional, used for DB history)

        Returns:
            Chatbot's reply

        Raises:
            RuntimeError: If generation fails
        """
        try:
            # Nếu có recent_messages từ DB, dùng nó để rebuild context
            if recent_messages:
                # Rebuild lịch sử từ DB
                history = []
                for msg in recent_messages:
                    role = "user" if msg["role"] == "user" else "model"
                    history.append({"role": role, "parts": [msg["content"]]})
                
                # Tạo session mới với history
                self.chat_session = self.model.start_chat(history=history)
            
            # Lấy hoặc tạo session
            chat = self._get_chat_session()

            # Đưa cảm xúc vào prompt như metadata
            user_prompt = f"[System Note: User's detected emotion is '{emotion}'. Respond accordingly.]\nUser: {user_text}"

            # Dùng send_message để giữ lịch sử
            response = chat.send_message(user_prompt)
            reply_text = (response.text or "").strip()

            if not reply_text:
                logger.warning("Empty response from Gemini")
                return "Xin lỗi, tôi chưa nghe rõ."

            logger.info(f"Chat response generated: {len(reply_text)} characters")
            return reply_text

        except Exception as e:
            logger.error(f"Chatbot error: {e}")
            # Reset session nếu lỗi
            self.chat_session = None
            raise RuntimeError(f"Failed to generate chat response: {str(e)}")


# Singleton instance
chatbot_service = ChatbotService()
