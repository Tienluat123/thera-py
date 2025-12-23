import tempfile
import os
from faster_whisper import WhisperModel

# Load model 1 lần khi backend start
model = WhisperModel(
    "small",          # tiny / base / small / medium
    device="cpu",     # đổi "cuda" nếu có GPU
    compute_type="int8"
)

def speech_to_text(audio_bytes):
    tmp_path = None
    try:
        # Lưu audio tạm
        with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as f:
            f.write(audio_bytes)
            tmp_path = f.name

        # Transcribe
        segments, info = model.transcribe(
            tmp_path,
            language="vi"
        )

        text = ""
        for segment in segments:
            text += segment.text

        return text.strip()

    finally:
        if tmp_path and os.path.exists(tmp_path):
            os.remove(tmp_path)


