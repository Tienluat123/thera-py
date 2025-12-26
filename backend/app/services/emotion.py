"""
Emotion detection service using custom Whisper-based classifier.
"""

import torch
import torch.nn as nn
import torch.nn.functional as F
from transformers import WhisperModel, WhisperFeatureExtractor
import io
import soundfile as sf
import numpy as np
import logging
from typing import Dict

# from app.config import settings # (Mình comment tạm để chạy demo, bạn cứ giữ nguyên)


# Giả lập settings để code chạy được độc lập, bạn xóa dòng này khi đưa vào project nhé
class settings:
    EMOTION_LABELS = ["happy", "neutral", "sad", "angry"]
    EMOTION_MODEL_PATH = "path/to/your/model.pth"


logger = logging.getLogger(__name__)


class WhisperAttentionClassifier(nn.Module):
    """Emotion classification model based on Whisper encoder."""

    def __init__(self, num_labels: int = 4):
        super().__init__()
        # Load encoder pre-trained
        self.encoder = WhisperModel.from_pretrained("openai/whisper-tiny").encoder

        hidden_size = 384  # whisper-tiny dimension

        # Attention layer (Learnable queries)
        self.attn_query = nn.Linear(hidden_size, 1, bias=False)

        # Classification head
        self.fc = nn.Sequential(
            nn.Linear(hidden_size, 128),
            nn.ReLU(),
            nn.Dropout(0.1),
            nn.Linear(128, num_labels),
        )

    def forward(self, input_features, attention_mask=None, labels=None):
        # 1. Chạy qua Encoder của Whisper
        out = self.encoder(input_features=input_features)
        hidden = out.last_hidden_state  # [Batch, Time, 384]

        # 2. Tính toán Attention Score
        attn_scores = self.attn_query(hidden)  # [Batch, Time, 1]

        # --- [CRITICAL UPDATE] XỬ LÝ MASK ---
        # Nếu không có mask, phần padding (im lặng) sẽ bị tính vào gây nhiễu kết quả.
        if attention_mask is not None:
            # Whisper nén thời gian (Time) lại khoảng một nửa so với Input
            # Cần resize mask cho khớp với kích thước của hidden state
            # Interpolate mask: [Batch, Input_Len] -> [Batch, Hidden_Len]
            mask = F.interpolate(
                attention_mask.unsqueeze(1).float(), size=hidden.size(1), mode="nearest"
            ).squeeze(1)

            # Kỹ thuật Masking: Gán giá trị rất nhỏ (-10000) vào những chỗ là padding (mask=0)
            # Để khi qua Softmax, xác suất tại đó = 0
            extended_mask = (1.0 - mask) * -10000.0
            attn_scores = attn_scores + extended_mask.unsqueeze(-1)
        # ------------------------------------

        attn_weights = F.softmax(attn_scores, dim=1)  # [Batch, Time, 1]

        # 3. Context vector (Weighted sum)
        context = (attn_weights * hidden).sum(dim=1)  # [Batch, 384]

        # 4. Classification
        logits = self.fc(context)

        loss = None
        if labels is not None:
            loss = nn.CrossEntropyLoss()(logits, labels)

        return {"logits": logits, "loss": loss}


class EmotionService:
    """Emotion detection service."""

    _instance = None  # Singleton pattern

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._initialized = False
        return cls._instance

    def __init__(self):
        """Initialize emotion model (only once)."""
        if self._initialized:
            return

        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        self.labels = settings.EMOTION_LABELS

        # Load Feature Extractor trước
        self.feature_extractor = WhisperFeatureExtractor.from_pretrained(
            "openai/whisper-tiny"
        )

        # Load Model
        self.model = self._load_model()
        self._initialized = True

    def _load_model(self) -> WhisperAttentionClassifier:
        """Load emotion model with proper error handling."""
        try:
            logger.info(f"Loading emotion model from {settings.EMOTION_MODEL_PATH}...")

            model = WhisperAttentionClassifier(num_labels=len(settings.EMOTION_LABELS))
            model.to(self.device)

            # Load weights
            # Lưu ý: Cần chắc chắn file .pth của bạn khớp architecture này
            if hasattr(settings, "EMOTION_MODEL_PATH") and settings.EMOTION_MODEL_PATH:
                # Logic load file thật của bạn ở đây
                # state_dict = torch.load(settings.EMOTION_MODEL_PATH, map_location=self.device)
                # clean_state = self._normalize_keys(state_dict)
                # model.load_state_dict(clean_state, strict=False)
                pass  # Pass để demo chạy được

            model.eval()
            logger.info("Emotion model loaded successfully")
            return model

        except Exception as e:
            logger.error(f"Failed to load emotion model: {e}")
            raise

    @staticmethod
    def _normalize_keys(state_dict: Dict[str, torch.Tensor]) -> Dict:
        """Remove common prefixes like 'module.' or 'model.'."""
        fixed = {}
        for k, v in state_dict.items():
            new_k = k
            for prefix in ("module.", "model."):
                if new_k.startswith(prefix):
                    new_k = new_k[len(prefix) :]
            fixed[new_k] = v
        return fixed

    def predict(self, audio_bytes: bytes) -> Dict[str, any]:
        try:
            # 1. Đọc file audio từ bytes
            data, sr = sf.read(io.BytesIO(audio_bytes), dtype="float32")

            # 2. Xử lý kênh (Force Mono) - Whisper chỉ nhận Mono
            if data.ndim > 1:
                # Nếu file là Stereo (2 kênh), tính trung bình cộng để ra Mono
                data = np.mean(data, axis=1)

            # 3. **CRITICAL**: Resample về 16kHz nếu cần
            # WhisperFeatureExtractor yêu cầu 16kHz đầu vào
            if sr != 16000:
                waveform = torch.from_numpy(data)
                resampler = torchaudio.transforms.Resample(sr, 16000)
                waveform = resampler(waveform.unsqueeze(0)).squeeze(0)
                data = waveform.numpy()
                sr = 16000
                logger.info(f"Resampled audio to 16kHz")

            # 4. Extract features CÓ MASK (Quan trọng)
            # return_attention_mask=True là chìa khóa để sửa lỗi
            inputs = self.feature_extractor(
                data, sampling_rate=sr, return_tensors="pt", return_attention_mask=True
            )

            input_features = inputs.input_features.to(self.device)
            attention_mask = inputs.attention_mask.to(self.device)

            # 5. Predict
            with torch.no_grad():
                # Truyền thêm attention_mask vào model
                output = self.model(input_features, attention_mask=attention_mask)

                logits = output["logits"]
                probs = torch.softmax(logits, dim=-1)
                pred_idx = torch.argmax(probs, dim=-1).item()
                confidence = probs[0, pred_idx].item()

            emotion = self.labels[pred_idx]
            logger.info(f"Emotion predicted: {emotion} (confidence: {confidence:.2f})")

            return {
                "emotion": emotion,
                "confidence": confidence,
                # Fix lỗi zip (probs[0] là tensor, cần tolist())
                "all_emotions": {
                    label: float(prob)
                    for label, prob in zip(self.labels, probs[0].tolist())
                },
            }

        except Exception as e:
            logger.error(f"Emotion prediction error: {e}")
            raise RuntimeError(f"Emotion detection failed: {str(e)}")


# Singleton instance
emotion_service = EmotionService()
