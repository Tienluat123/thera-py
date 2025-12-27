import os
import warnings
import logging
from groq import Groq
import google.generativeai as genai
from app.config import settings

warnings.filterwarnings("ignore", category=FutureWarning, module="google.generativeai")
logger = logging.getLogger(__name__)

class ChatbotService:
    def __init__(self):
        """Khởi tạo Groq làm model chính, Gemini làm fallback."""

        groq_api_key = os.getenv("GROQ_API_KEY")
        self.groq_model = os.getenv("GROQ_MODEL", "llama-3.1-8b-instant")
        self.groq_client = Groq(api_key=groq_api_key) if groq_api_key else None

        # Gemini fallback (tùy chọn)
        gemini_api_key = settings.GOOGLE_API_KEY or os.getenv("GEMINI_API_KEY")
        self.gemini_enabled = bool(gemini_api_key)
        if self.gemini_enabled:
            genai.configure(api_key=gemini_api_key)
            self.safety_settings = [
                {"category": "HARM_CATEGORY_HARASSMENT", "threshold": "BLOCK_ONLY_HIGH"},
                {"category": "HARM_CATEGORY_HATE_SPEECH", "threshold": "BLOCK_ONLY_HIGH"},
                {"category": "HARM_CATEGORY_SEXUALLY_EXPLICIT", "threshold": "BLOCK_ONLY_HIGH"},
                {"category": "HARM_CATEGORY_DANGEROUS_CONTENT", "threshold": "BLOCK_ONLY_HIGH"},
            ]
            self.generation_config = {
                "temperature": settings.LLM_TEMPERATURE,
                "max_output_tokens": settings.LLM_MAX_TOKENS,
                "top_p": 0.95,
            }
            self.model_name = settings.GEMINI_MODEL
        else:
            self.safety_settings = []
            self.generation_config = {}
            self.model_name = ""

        if not self.groq_client and not self.gemini_enabled:
            raise RuntimeError("Missing both GROQ_API_KEY and GEMINI/GOOGLE_API_KEY")

    def get_reply(self, user_text: str, emotion: str = "neutral", recent_messages: list[dict] | None = None) -> str:
        try:
            history_messages = []
            if recent_messages:
                limited_messages = recent_messages[-10:]
                for msg in limited_messages:
                    role = "assistant" if msg.get("role") != "user" else "user"
                    history_messages.append({"role": role, "content": msg.get("content", "")})

            system_prompt = (
                "Bạn là chatbot giao tiếp bằng giọng nói. "
                "Trả lời hoàn toàn bằng tiếng Việt, ngắn gọn, tự nhiên, thân thiện. "
                "Điều chỉnh giọng điệu phù hợp với trạng thái người dùng. "
                "KHÔNG nói tên cảm xúc, KHÔNG phán xét."
            )

            user_prompt = (
                f"Ngữ cảnh cảm xúc (ẩn, không được nhắc): {emotion}\n"
                f"Người dùng nói: \"{user_text}\""
            )

            messages = [{"role": "system", "content": system_prompt}] + history_messages + [
                {"role": "user", "content": user_prompt}
            ]

            completion = self.groq_client.chat.completions.create(
                model=self.groq_model,
                messages=messages,
                temperature=settings.LLM_TEMPERATURE,
                max_tokens=settings.LLM_MAX_TOKENS,
            )

            reply_text = (completion.choices[0].message.content or "").strip()
            if reply_text:
                return reply_text

            raise RuntimeError("Groq trả về rỗng")

        except Exception as groq_err:
            logger.error("Groq error, fallback to Gemini if enabled: %s", groq_err, exc_info=True)

            if not self.gemini_enabled:
                return "Hệ thống đang bận chút xíu."

            try:
                dynamic_instruction = (
                    "Bạn là chatbot giao tiếp bằng giọng nói tiếng Việt. "
                    "Quy tắc: Trả lời cực ngắn (dưới 2 câu), không emoji. "
                    f"Người dùng đang cảm thấy: '{emotion}'. Điều chỉnh giọng điệu phù hợp."
                )

                model = genai.GenerativeModel(
                    model_name=self.model_name,
                    system_instruction=dynamic_instruction,
                    generation_config=self.generation_config,
                    safety_settings=self.safety_settings,
                )

                chat = model.start_chat(history=[])
                response = chat.send_message(user_text)
                reply_text = (response.text or "").strip()
                return reply_text if reply_text else "Xin lỗi, tôi chưa nghe rõ."

            except Exception as gemini_err:
                logger.error("Gemini fallback error: %s", gemini_err, exc_info=True)
                return "Hệ thống đang bận chút xíu."

chatbot_service = ChatbotService()

