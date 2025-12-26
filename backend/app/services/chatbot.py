import google.generativeai as genai
import logging
from app.config import settings

logger = logging.getLogger(__name__)

class ChatbotService:
    def __init__(self):
        self.model = self._init_model()
        # Lưu session chat riêng biệt (nếu chạy local 1 người dùng)
        # Nếu chạy server nhiều user, bạn phải quản lý history bên ngoài class này
        self.chat_session = None 

    def _init_model(self):
        api_key = settings.GOOGLE_API_KEY
        if not api_key:
            raise RuntimeError("Missing GOOGLE_API_KEY")

        genai.configure(api_key=api_key)
        
        # Cấu hình an toàn (Safety Settings) để tránh bot bị block câu trả lời
        safety_settings = [
            {"category": "HARM_CATEGORY_HARASSMENT", "threshold": "BLOCK_ONLY_HIGH"},
            {"category": "HARM_CATEGORY_HATE_SPEECH", "threshold": "BLOCK_ONLY_HIGH"},
            {"category": "HARM_CATEGORY_SEXUALLY_EXPLICIT", "threshold": "BLOCK_ONLY_HIGH"},
            {"category": "HARM_CATEGORY_DANGEROUS_CONTENT", "threshold": "BLOCK_ONLY_HIGH"},
        ]

        return genai.GenerativeModel(
            model_name=settings.GEMINI_MODEL,
            # System instruction chỉ cài 1 lần ở đây là tốt nhất
            system_instruction=(
                "Bạn là trợ lý ảo giao tiếp bằng giọng nói. "
                "1. Trả lời TIẾNG VIỆT, ngắn gọn (dưới 2 câu), súc tích để người dùng nghe kịp. "
                "2. Giọng điệu tự nhiên, như người thật, có cảm xúc. "
                "3. KHÔNG dùng icon, emoji (vì đây là voice chat). "
                "4. Dựa vào ngữ cảnh cảm xúc được cung cấp để điều chỉnh thái độ (vui vẻ, đồng cảm, bình tĩnh...)."
            ),
            generation_config={
                "temperature": 0.7, # 0.7 giúp câu trả lời sáng tạo nhưng không quá bay bổng
                "max_output_tokens": 150, # Voice chat cần ngắn gọn
            },
            safety_settings=safety_settings
        )

    def _get_chat_session(self):
        """Khởi tạo session nếu chưa có (Dành cho single user)"""
        if self.chat_session is None:
            self.chat_session = self.model.start_chat(history=[])
        return self.chat_session

    def get_reply(self, user_text: str, emotion: str = "neutral") -> str:
        try:
            chat = self._get_chat_session()

            # Kỹ thuật Prompting: Đưa cảm xúc vào ngoặc vuông để model hiểu đây là meta-data
            # chứ không phải lời nói của user.
            user_prompt = f"[System Note: User's detected emotion is '{emotion}'. Respond accordingly.]\nUser: {user_text}"

            # Dùng send_message thay vì generate_content để Giữ Lịch Sử (Context)
            response = chat.send_message(user_prompt)
            
            reply_text = (response.text or "").strip()
            
            # Xử lý trường hợp trả về rỗng
            if not reply_text:
                return "Xin lỗi, tôi chưa nghe rõ."

            logger.info(f"Bot reply: {reply_text}")
            return reply_text

        except Exception as e:
            logger.error(f"Chatbot error: {e}")
            # Reset session nếu lỗi, tránh kẹt lịch sử bị lỗi
            self.chat_session = None 
            return "Xin lỗi, hệ thống đang gặp chút sự cố."

# Lưu ý: Nếu dùng Web Server (FastAPI/Flask), không nên dùng singleton chatbot_service 
# để lưu session như trên. Bạn cần truyền history từ Client lên.
chatbot_service = ChatbotService()
