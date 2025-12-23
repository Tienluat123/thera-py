import torch
import io
import soundfile as sf
from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles


from emotion_model import EmotionModel
from whisper_stt import speech_to_text
from chatbot import chat_response
from tts import text_to_speech

app = FastAPI()

app.mount("/audio", StaticFiles(directory="audio"), name="audio")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

emotion_model = EmotionModel("model/whisper.pt")

@app.post("/emotion")
async def detect_emotion(file: UploadFile = File(...)):
    audio_bytes = await file.read()

    # đọc audio từ bytes
    data, sr = sf.read(io.BytesIO(audio_bytes), dtype="float32")

    # (channels, samples)
    waveform = torch.from_numpy(data).T

    result = emotion_model.predict(waveform, sr)
    return result

@app.post("/chat")
async def chat(file: UploadFile = File(...)):
    audio_bytes = await file.read()

    text = speech_to_text(audio_bytes)
    emotion = "neutral"
    reply_text = chat_response(text, emotion)
    audio_path = text_to_speech(reply_text, emotion)


    return {
        "user_text": text,
        "reply_text": reply_text,
        "audio_url": "/" + audio_path.replace("\\", "/"),
        "emotion": emotion
    }
