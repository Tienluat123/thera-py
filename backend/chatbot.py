import os
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()

GENAI_API_KEY = os.getenv("GOOGLE_API_KEY") or os.getenv("GEMINI_API_KEY")

if not GENAI_API_KEY:
    raise RuntimeError("GOOGLE_API_KEY (hoặc GEMINI_API_KEY) chưa được thiết lập")

genai.configure(api_key=GENAI_API_KEY)

model = genai.GenerativeModel(
    # Dùng model ổn định, tương thích generateContent
    model_name="gemini-3-flash-preview",
    system_instruction=(
        "Bạn là chatbot giao tiếp bằng giọng nói. Trả lời hoàn toàn bằng tiếng Việt, ngắn gọn, tự nhiên, thân thiện. "
        "Điều chỉnh giọng điệu phù hợp với trạng thái người dùng. KHÔNG nói tên cảm xúc, KHÔNG phán xét."
    ),
    generation_config={
        "temperature": 0.7,
        "max_output_tokens": 200,
    },
)

def chat_response(user_text, emotion):
    user_prompt = (
        f"Ngữ cảnh cảm xúc (ẩn, không được nhắc): {emotion}\n"
        f"Người dùng nói: \"{user_text}\""
    )

    response = model.generate_content(user_prompt)
    return (response.text or "") .strip()
