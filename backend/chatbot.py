import os
from groq import Groq
from dotenv import load_dotenv

load_dotenv()

GROQ_API_KEY = os.getenv("GROQ_API_KEY")

client = Groq(
    api_key=GROQ_API_KEY
)


def chat_response(user_text, emotion):
    system_prompt = """
Bạn là chatbot giao tiếp bằng giọng nói.
Yêu cầu:
- Trả lời hoàn toàn bằng tiếng Việt
- Ngắn gọn, tự nhiên, thân thiện
- Điều chỉnh giọng điệu phù hợp với trạng thái người dùng
- KHÔNG nói tên cảm xúc
- KHÔNG phán xét
"""

    user_prompt = f"""
Ngữ cảnh cảm xúc (ẩn, không được nhắc): {emotion}
Người dùng nói: "{user_text}"
"""

    completion = client.chat.completions.create(
        model="llama-3.1-8b-instant",
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ],
        temperature=0.7,
        max_tokens=150
    )

    return completion.choices[0].message.content.strip()
