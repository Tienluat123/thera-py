import axios from "axios";
import { API_CONFIG } from "./config";

const apiClient = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
});

export async function createConversation(title, token) {
  try {
    const response = await apiClient.post(
      `/api/conversations`,
      new URLSearchParams({ title: title || "New Conversation" }),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Create conversation error:", error);
    throw error;
  }
}

/**
 * Detect emotion from audio file
 */
export async function detectEmotion(audioBlob) {
  const formData = new FormData();
  formData.append("file", audioBlob, "audio.wav");

  try {
    const response = await apiClient.post("/api/emotion", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  } catch (error) {
    console.error(
      "Emotion detection error:",
      error.response?.data || error.message
    );
    throw error;
  }
}

/**
 * Main chat endpoint - Single request
 * Sends audio + text, backend returns reply + emotion
 */
export async function chat(audioBlob, text, token, conversationId) {
  const formData = new FormData();
  formData.append("file", audioBlob, "audio.wav");
  formData.append("text", text || "");
  if (conversationId) {
    formData.append("conversation_id", conversationId);
  }

  try {
    const response = await apiClient.post("/api/chat", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    });
    return response.data;
  } catch (error) {
    console.error("Chat error:", error.response?.data || error.message);
    throw error;
  }
}

/**
 * Chat with text only (text + emotion context)
 * Used by ChatPage for follow-up messages
 * Creates a minimal valid WAV file since backend requires audio input
 */
export async function chatWithText(text, emotion) {
  const formData = new FormData();

  // Create a minimal valid WAV file (100ms of silence at 16kHz)
  const sampleRate = 16000;
  const duration = 0.1; // 100ms
  const samples = sampleRate * duration;
  const audioData = new Float32Array(samples); // all zeros = silence

  // Create WAV blob
  const wavBlob = createWavBlob(audioData, sampleRate);

  formData.append("file", wavBlob, "silent.wav");
  formData.append("text", text || "");

  try {
    const response = await apiClient.post("/api/chat", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  } catch (error) {
    console.error("Chat error:", error.response?.data || error.message);
    throw error;
  }
}

/**
 * Create a minimal WAV file from audio samples
 * WAV format: RIFF header + fmt chunk + data chunk
 */
function createWavBlob(audioData, sampleRate = 16000) {
  const numChannels = 1;
  const bitsPerSample = 16;
  const byteRate = (sampleRate * numChannels * bitsPerSample) / 8;
  const blockAlign = (numChannels * bitsPerSample) / 8;
  const dataLength = audioData.length * 2;
  const fileLength = 36 + dataLength;

  // Create WAV header (44 bytes)
  const header = new ArrayBuffer(44);
  const view = new DataView(header);

  // RIFF chunk descriptor
  view.setUint8(0, 0x52); // 'R'
  view.setUint8(1, 0x49); // 'I'
  view.setUint8(2, 0x46); // 'F'
  view.setUint8(3, 0x46); // 'F'
  view.setUint32(4, fileLength, true); // file size - 8
  view.setUint8(8, 0x57); // 'W'
  view.setUint8(9, 0x41); // 'A'
  view.setUint8(10, 0x56); // 'V'
  view.setUint8(11, 0x45); // 'E'

  // fmt sub-chunk
  view.setUint8(12, 0x66); // 'f'
  view.setUint8(13, 0x6d); // 'm'
  view.setUint8(14, 0x74); // 't'
  view.setUint8(15, 0x20); // ' '
  view.setUint32(16, 16, true); // Subchunk1Size (16 for PCM)
  view.setUint16(20, 1, true); // AudioFormat (1 for PCM)
  view.setUint16(22, numChannels, true); // NumChannels
  view.setUint32(24, sampleRate, true); // SampleRate
  view.setUint32(28, byteRate, true); // ByteRate
  view.setUint16(32, blockAlign, true); // BlockAlign
  view.setUint16(34, bitsPerSample, true); // BitsPerSample

  // data sub-chunk
  view.setUint8(36, 0x64); // 'd'
  view.setUint8(37, 0x61); // 'a'
  view.setUint8(38, 0x74); // 't'
  view.setUint8(39, 0x61); // 'a'
  view.setUint32(40, dataLength, true); // Subchunk2Size

  // Convert float32 samples to int16 PCM
  const pcmData = new Int16Array(audioData.length);
  for (let i = 0; i < audioData.length; i++) {
    const s = Math.max(-1, Math.min(1, audioData[i]));
    pcmData[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
  }

  // Combine header + PCM data into single Uint8Array
  const wavData = new Uint8Array(44 + pcmData.byteLength);
  wavData.set(new Uint8Array(header), 0);
  wavData.set(new Uint8Array(pcmData.buffer), 44);

  return new Blob([wavData], { type: "audio/wav" });
}

export default apiClient;
