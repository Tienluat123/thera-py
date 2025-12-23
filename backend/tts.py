from gtts import gTTS
import uuid
import os

def text_to_speech(text, emotion):
    os.makedirs("audio", exist_ok=True)

    filename = f"tts_{uuid.uuid4().hex}.mp3"
    path = os.path.join("audio", filename)

    # gTTS không chỉnh được giọng, nhưng ta có thể
    # điều chỉnh nội dung theo emotion (rất ổn cho đồ án)
    tts = gTTS(text=text, lang="vi", slow=(emotion == "sad"))
    tts.save(path)

    return path
