import os
import logging
import warnings
import google.generativeai as genai
from app.config import settings

# Suppress FutureWarning for deprecated google-generativeai
warnings.filterwarnings("ignore", category=FutureWarning, module="google.generativeai")

logger = logging.getLogger(__name__)


class ChatbotService:
    def __init__(self):
        """Khởi tạo model config 1 lần duy nhất."""
        api_key = settings.GOOGLE_API_KEY
        if not api_key:
            raise RuntimeError("Missing GOOGLE_API_KEY")

        genai.configure(api_key=api_key)

        # Cấu hình an toàn
        self.safety_settings = [
            {"category": "HARM_CATEGORY_HARASSMENT", "threshold": "BLOCK_ONLY_HIGH"},
            {"category": "HARM_CATEGORY_HATE_SPEECH", "threshold": "BLOCK_ONLY_HIGH"},
            {
                "category": "HARM_CATEGORY_SEXUALLY_EXPLICIT",
                "threshold": "BLOCK_ONLY_HIGH",
            },
            {
                "category": "HARM_CATEGORY_DANGEROUS_CONTENT",
                "threshold": "BLOCK_ONLY_HIGH",
            },
        ]

        # Cấu hình sinh văn bản
        self.generation_config = {
            "temperature": settings.LLM_TEMPERATURE,
            "max_output_tokens": settings.LLM_MAX_TOKENS,
            "top_p": 0.95,
        }

        # Model tên gì
        self.model_name = settings.GEMINI_MODEL

    def get_reply(
        self,
        user_text: str,
        emotion: str = "neutral",
        recent_messages: list[dict] | None = None,
    ) -> str:
        try:
            # 1. TỐI ƯU LỊCH SỬ (SLIDING WINDOW)
            # Chỉ lấy tối đa 10 tin nhắn gần nhất để tiết kiệm token đầu vào
            history_context = []
            if recent_messages:
                # Giả sử recent_messages là list đã sort theo thời gian
                # Lấy 10 tin cuối cùng:
                limited_messages = recent_messages[-10:]

                for msg in limited_messages:
                    role = "user" if msg["role"] == "user" else "model"
                    history_context.append({"role": role, "parts": [msg["content"]]})

            # 2. CẬP NHẬT SYSTEM INSTRUCTION DỰA TRÊN CẢM XÚC
            # Thay vì nhồi vào user_prompt, ta nhồi thẳng vào system instruction để mạnh mẽ hơn và sạch history
            dynamic_instruction = (
                "Bạn là trợ lý ảo giao tiếp bằng giọng nói tiếng Việt. "
                "Quy tắc: "
                "1. Trả lời cực ngắn (dưới 2 câu). "
                "2. Không dùng emoji. "
                f"3. Người dùng đang cảm thấy: '{emotion}'. Hãy điều chỉnh giọng điệu phù hợp (Vui vẻ thì hào hứng, Buồn thì nhẹ nhàng)."
            )

            # 3. KHỞI TẠO MODEL
            model = genai.GenerativeModel(
                model_name=self.model_name,
                system_instruction=dynamic_instruction,
                generation_config=self.generation_config,
                safety_settings=self.safety_settings,
            )

            # 4. TẠO CHAT SESSION VỚI LỊCH SỬ
            chat = model.start_chat(history=history_context)

            # 5. GỬI TIN NHẮN
            response = chat.send_message(user_text)

            reply_text = (response.text or "").strip()

            return reply_text if reply_text else "Xin lỗi, tôi chưa nghe rõ."

        except Exception as e:
            logger.error(f"Chatbot error: {e}")
            return "Hệ thống đang bận chút xíu."


chatbot_service = ChatbotService()
