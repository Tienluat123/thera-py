"""
Emotion detection service using custom Whisper-based classifier.
"""

import torch
import torch.nn as nn
import torch.nn.functional as F
from transformers import WhisperModel, WhisperFeatureExtractor
import io
import soundfile as sf
import logging
from typing import Dict
from app.config import settings

logger = logging.getLogger(__name__)


class WhisperAttentionClassifier(nn.Module):
    """Emotion classification model based on Whisper encoder."""

    def __init__(self, num_labels: int = 4):
        super().__init__()
        self.encoder = WhisperModel.from_pretrained("openai/whisper-tiny").encoder

        hidden_size = 384  # whisper-tiny

        # Attention layer
        self.attn_query = nn.Linear(hidden_size, 1, bias=False)

        # Classification head
        self.fc = nn.Sequential(
            nn.Linear(hidden_size, 128),
            nn.ReLU(),
            nn.Dropout(0.1),
            nn.Linear(128, num_labels),
        )

    def forward(self, input_features, labels=None):
        out = self.encoder(input_features=input_features)
        hidden = out.last_hidden_state  # [B, T, 384]

        attn_scores = self.attn_query(hidden)  # [B, T, 1]
        attn_weights = F.softmax(attn_scores, dim=1)  # [B, T, 1]

        context = (attn_weights * hidden).sum(dim=1)  # [B, 384]

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
        self.model = self._load_model()
        self.feature_extractor = WhisperFeatureExtractor.from_pretrained(
            "openai/whisper-tiny"
        )
        self.labels = settings.EMOTION_LABELS
        self._initialized = True

    def _load_model(self) -> WhisperAttentionClassifier:
        """Load emotion model with proper error handling."""
        try:
            logger.info(f"Loading emotion model from {settings.EMOTION_MODEL_PATH}...")

            model = WhisperAttentionClassifier(num_labels=len(settings.EMOTION_LABELS))
            model.to(self.device)

            state_dict = torch.load(
                settings.EMOTION_MODEL_PATH, map_location=self.device
            )
            clean_state = self._normalize_keys(state_dict)

            missing, unexpected = model.load_state_dict(clean_state, strict=False)
            if missing:
                logger.warning(f"Missing keys: {missing}")
            if unexpected:
                logger.warning(f"Unexpected keys: {unexpected}")

            model.eval()
            logger.info("Emotion model loaded successfully")
            return model

        except Exception as e:
            logger.error(f"Failed to load emotion model: {e}")
            raise

    @staticmethod
    def _normalize_keys(state_dict: Dict[str, torch.Tensor]) -> Dict:
        """Remove common prefixes like 'module.' or 'model.' from checkpoints."""
        fixed = {}
        for k, v in state_dict.items():
            new_k = k
            for prefix in ("module.", "model."):
                if new_k.startswith(prefix):
                    new_k = new_k[len(prefix) :]
            fixed[new_k] = v
        return fixed

    def predict(self, audio_bytes: bytes) -> Dict[str, any]:
        """
        Predict emotion from audio bytes.

        Args:
            audio_bytes: Raw audio data

        Returns:
            Dictionary with emotion and confidence score

        Raises:
            RuntimeError: If prediction fails
        """
        try:
            # Convert bytes to waveform
            data, sr = sf.read(io.BytesIO(audio_bytes), dtype="float32")
            waveform = torch.from_numpy(data).T

            # Extract features
            input_features = self.feature_extractor(
                waveform.numpy(), sampling_rate=sr, return_tensors="pt"
            )["input_features"]

            input_features = input_features.to(self.device)

            # Predict
            with torch.no_grad():
                output = self.model(input_features)
                logits = output["logits"]
                probs = torch.softmax(logits, dim=-1)
                pred_idx = torch.argmax(probs, dim=-1).item()
                confidence = probs[0, pred_idx].item()

            emotion = self.labels[pred_idx]
            logger.info(f"Emotion predicted: {emotion} (confidence: {confidence:.2f})")

            return {
                "emotion": emotion,
                "confidence": confidence,
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
